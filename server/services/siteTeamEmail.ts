import type { P5BridgeResult, P5TeamAlert } from "@/server/services/p5IntakeBridge";

/**
 * One team email per request (owner decision, 17 November 2026).
 *
 * A request form submission used to put two emails in the shared family
 * inbox: this site's own team email and the one p5homeco.com sends when the
 * request is forwarded to its intake. The P5 email is the one that stays. This
 * site's team email is the fallback, sent to the shared inbox only when P5 did
 * not confirm that its email went.
 *
 * A lead must never end with zero team emails. Only the exact answer "sent"
 * skips the shared inbox. Everything else ("failed", "none", "unknown", a
 * bridge that threw, a request that was never forwarded) sends the site's
 * team email to every recipient exactly as before.
 */

/** The shared family mailbox is `hello@` at any of these (aliases of one inbox). */
export const SHARED_FAMILY_INBOX_LOCAL_PART = "hello";
export const SHARED_FAMILY_INBOX_DOMAINS = [
  "p5homeco.com",
  "boisecabinet.co",
  "boiseconstruction.co",
  "boiseremodeling.co",
  "boisehandyman.co",
  "boiseadu.co",
] as const;

/**
 * True for the mailbox that already receives the P5 team email. Accepts a bare
 * address or `Name <address>`, in any letter case. Anything it cannot read is
 * not the shared inbox, so that recipient keeps the site's email.
 */
export function isSharedFamilyInbox(address: string | null | undefined): boolean {
  const raw = (address ?? "").trim();
  const bracketed = /<([^<>]+)>\s*$/.exec(raw);
  const email = (bracketed ? bracketed[1] : raw).trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at <= 0) return false;
  return (
    email.slice(0, at) === SHARED_FAMILY_INBOX_LOCAL_PART &&
    (SHARED_FAMILY_INBOX_DOMAINS as readonly string[]).includes(email.slice(at + 1))
  );
}

/** What the fallback decision was made from. "not-forwarded": the bridge was never called. */
export type SiteTeamEmailBasis = P5TeamAlert | "not-forwarded";

/**
 * Who gets this site's team email. Only a confirmed P5 email removes the
 * shared inbox. Any other admin recipient is never removed.
 */
export function siteTeamEmailRecipients(
  recipients: ReadonlyArray<string>,
  basis: SiteTeamEmailBasis | null | undefined,
): string[] {
  if (basis !== "sent") return [...recipients];
  return recipients.filter((recipient) => !isSharedFamilyInbox(recipient));
}

export interface SiteTeamEmailOutcome {
  basis: SiteTeamEmailBasis;
  /** Recipients this site emailed. */
  sentTo: string[];
  /** Shared inbox recipients left to the confirmed P5 email. */
  leftToP5: string[];
}

/**
 * Waits for the bridge result, then sends this site's team email to whoever
 * still needs it. Run it off the visitor's path (kept alive with after()): P5
 * can take about 25 seconds to say whether its email went.
 *
 * A bridge promise that rejects counts as "unknown", so the email goes to
 * everyone. A send failure is thrown, exactly as the send loop always did, so
 * the caller records the channel as failed.
 */
export async function sendSiteTeamEmail(input: {
  /** The pending bridge call, or null when nothing was forwarded to P5. */
  bridge: Promise<P5BridgeResult> | null | undefined;
  recipients: () => Promise<ReadonlyArray<string>>;
  send: (to: string) => Promise<void>;
  /** For the log line, e.g. "consultation" or "consultation-details". */
  label: string;
}): Promise<SiteTeamEmailOutcome> {
  let basis: SiteTeamEmailBasis = "not-forwarded";
  if (input.bridge) {
    try {
      const alert = (await input.bridge)?.alert;
      basis = alert === "sent" || alert === "failed" || alert === "none" ? alert : "unknown";
    } catch {
      basis = "unknown";
    }
  }
  const all = await input.recipients();
  const sentTo = siteTeamEmailRecipients(all, basis);
  const leftToP5 = all.filter((recipient) => !sentTo.includes(recipient));
  for (const to of sentTo) await input.send(to);
  console.info(
    `[${input.label}] Team email (P5 team email: ${basis}): site email to ${sentTo.length} recipient${sentTo.length === 1 ? "" : "s"}, ${leftToP5.length} left to P5.`,
  );
  return { basis, sentTo, leftToP5 };
}
