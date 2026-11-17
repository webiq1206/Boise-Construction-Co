import test from "node:test";
import assert from "node:assert/strict";
import {
  P5_INTAKE_TIMEOUT_MS,
  P5_TEAM_NOTES_MAX_LINES,
  P5_TEAM_NOTE_MAX_LENGTH,
  buildP5IntakePayload,
  forwardConsultationToP5Intake,
  parseP5TeamAlert,
  sanitizeTeamNotes,
  type P5BridgeResult,
} from "../server/services/p5IntakeBridge.ts";
import {
  SHARED_FAMILY_INBOX_DOMAINS,
  isSharedFamilyInbox,
  sendSiteTeamEmail,
  siteTeamEmailRecipients,
} from "../server/services/siteTeamEmail.ts";
import {
  INTERNAL_FIGURE_WORDS,
  buildConsultationTeamNotes,
  buildDetailsTeamNotes,
  fitTeamNotes,
  mentionsInternalFigure,
} from "../server/services/consultationTeamNotes.ts";
import {
  LEADS_DASHBOARD_URL,
  buildAdminEmailHtml,
  buildSelectionRows,
  type VerifiedEstimate,
} from "../server/services/consultationEmail.ts";
import {
  EMPTY_REFINEMENTS,
  PROJECT_LABELS,
  calculateEstimate,
  getProjectSizeConfig,
  type FinishLevel,
  type ProjectType,
} from "../shared/estimateEngine.ts";
import { resolveInternalEstimate, resolveQuotedRange } from "../shared/costs/resolve.ts";
import { sanitizeAttribution } from "../lib/leadAttribution.ts";

/**
 * One team email per request (owner decision, 17 November 2026).
 *
 * The P5 team email is the one that stays. This site's own team email is the
 * fallback: the shared family inbox gets it only when P5 did not confirm that
 * its email went. A lead must never end with zero team emails.
 *
 * Nothing here touches the network: every P5 answer is a fake fetch.
 */

const SHARED = "hello@boiseconstruction.co";
const OTHER = "estimator@example.com";
const LEAD = { name: "Avery Sample", phone: "(208) 555-0142", projectType: "custom-home", inquiryKey: "inq_abcdefghijklmnopqrstuvwx" };

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

const answering = (body: unknown, status = 201): FetchLike => async () =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

/** The real bridge with a fake fetch, feeding the real fallback decision. */
async function teamEmailsFor(fetchImpl: FetchLike, recipients = [SHARED, OTHER], timeoutMs?: number) {
  const sent: string[] = [];
  const outcome = await sendSiteTeamEmail({
    bridge: forwardConsultationToP5Intake(LEAD, fetchImpl, timeoutMs ? { timeoutMs } : {}),
    label: "test",
    recipients: async () => recipients,
    send: async (to) => {
      sent.push(to);
    },
  });
  return { sent, outcome };
}

test("the shared family inbox is hello@ at any family domain, in any letter case", () => {
  assert.deepEqual([...SHARED_FAMILY_INBOX_DOMAINS].sort(), [
    "boiseadu.co",
    "boisecabinet.co",
    "boiseconstruction.co",
    "boisehandyman.co",
    "boiseremodeling.co",
    "p5homeco.com",
  ]);
  for (const domain of SHARED_FAMILY_INBOX_DOMAINS) {
    assert.equal(isSharedFamilyInbox(`hello@${domain}`), true, domain);
    assert.equal(isSharedFamilyInbox(`  Hello@${domain.toUpperCase()} `), true, domain);
    assert.equal(isSharedFamilyInbox(`P5 Home Co <HELLO@${domain}>`), true, domain);
  }
  for (const other of [
    "info@boiseconstruction.co",
    "hello@example.com",
    "hello@mail.boiseconstruction.co",
    "hello@boiseconstruction.com",
    "othello@boiseconstruction.co",
    "hello.team@p5homeco.com",
    "hello@p5homeco.com.example.com",
    "@p5homeco.com",
    "hello",
    "",
    null,
    undefined,
  ]) {
    assert.equal(isSharedFamilyInbox(other), false, String(other));
  }
});

test("only a confirmed P5 email removes the shared inbox, and no other recipient is ever removed", () => {
  const all = [SHARED, OTHER, "Hello@P5HomeCo.com"];
  assert.deepEqual(siteTeamEmailRecipients(all, "sent"), [OTHER]);
  for (const basis of ["failed", "none", "unknown", "not-forwarded", null, undefined] as const) {
    assert.deepEqual(siteTeamEmailRecipients(all, basis), all, String(basis));
  }
  assert.deepEqual(siteTeamEmailRecipients([SHARED], "sent"), [], "P5 already emailed the only recipient");
});

test("only the three exact answers count; anything else is not a confirmation", () => {
  assert.equal(parseP5TeamAlert({ alert: "sent" }), "sent");
  assert.equal(parseP5TeamAlert({ alert: "failed" }), "failed");
  assert.equal(parseP5TeamAlert({ alert: "none" }), "none");
  for (const answer of [
    {},
    { alert: "Sent" },
    { alert: " sent" },
    { alert: "delivered" },
    { alert: true },
    { alert: 1 },
    { alert: null },
    { alert: ["sent"] },
    { alert: { status: "sent" } },
    ["sent"],
    "sent",
    null,
    undefined,
    42,
  ]) {
    assert.equal(parseP5TeamAlert(answer), "unknown", JSON.stringify(answer));
  }
});

test("P5 confirmed its email: the shared inbox is skipped and another admin recipient is still emailed", async () => {
  const { sent, outcome } = await teamEmailsFor(answering({ ok: true, accepted: true, alert: "sent" }));
  assert.deepEqual(sent, [OTHER]);
  assert.deepEqual(outcome, { basis: "sent", sentTo: [OTHER], leftToP5: [SHARED] });

  const onlyShared = await teamEmailsFor(answering({ alert: "sent" }), [SHARED]);
  assert.deepEqual(onlyShared.sent, [], "this site's inbox copy is the duplicate the owner asked to remove");
  assert.deepEqual(onlyShared.outcome.leftToP5, [SHARED]);
});

test("P5 did not confirm: failed, none and an older P5 each send the site's team email to everyone", async () => {
  for (const [answer, basis] of [
    [{ ok: true, alert: "failed" }, "failed"],
    [{ ok: true, alert: "none" }, "none"],
    [{ ok: true, accepted: true }, "unknown"],
    [{ ok: true, alert: "SENT" }, "unknown"],
    [{ ok: true, alert: "queued" }, "unknown"],
  ] as const) {
    const { sent, outcome } = await teamEmailsFor(answering(answer));
    assert.deepEqual(sent, [SHARED, OTHER], JSON.stringify(answer));
    assert.equal(outcome.basis, basis);
    assert.deepEqual(outcome.leftToP5, []);
  }
  // A success status whose body is not JSON says nothing about the email.
  const notJson = await teamEmailsFor(answering("<html>ok</html>", 200));
  assert.deepEqual(notJson.sent, [SHARED, OTHER]);
  assert.equal(notJson.outcome.basis, "unknown");
});

test("an HTTP error sends the site's team email to everyone, even if the body claims sent", async () => {
  for (const status of [400, 422, 429, 500, 502, 503]) {
    const { sent, outcome } = await teamEmailsFor(answering({ alert: "sent" }, status));
    assert.deepEqual(sent, [SHARED, OTHER], String(status));
    assert.equal(outcome.basis, "unknown");
  }
});

test("a thrown fetch sends the site's team email to everyone", async () => {
  const { sent, outcome } = await teamEmailsFor(async () => {
    throw new Error("network down");
  });
  assert.deepEqual(sent, [SHARED, OTHER]);
  assert.equal(outcome.basis, "unknown");
});

test("a timeout sends the site's team email to everyone, and the bridge waits 30 seconds for P5", async () => {
  assert.equal(P5_INTAKE_TIMEOUT_MS, 30_000);
  // A P5 that never answers: the request ends only when the bridge aborts it.
  // (AbortSignal.timeout does not keep the process alive, so a plain timer does while the test waits.)
  const hanging: FetchLike = (_url, init) =>
    new Promise((_resolve, reject) => {
      const keepAlive = setTimeout(() => reject(new Error("the bridge never aborted the request")), 10_000);
      init.signal?.addEventListener("abort", () => {
        clearTimeout(keepAlive);
        reject(init.signal?.reason ?? new Error("aborted"));
      });
    });
  const started = Date.now();
  const { sent, outcome } = await teamEmailsFor(hanging, [SHARED, OTHER], 40);
  assert.ok(Date.now() - started < 5_000, "the test timeout, not the production one, ended the request");
  assert.deepEqual(sent, [SHARED, OTHER]);
  assert.equal(outcome.basis, "unknown");
});

test("no bridge call, a rejected bridge and a malformed result each send to everyone", async () => {
  const run = async (bridge: Promise<P5BridgeResult> | null | undefined) => {
    const sent: string[] = [];
    const outcome = await sendSiteTeamEmail({
      bridge,
      label: "test",
      recipients: async () => [SHARED, OTHER],
      send: async (to) => {
        sent.push(to);
      },
    });
    return { sent, basis: outcome.basis };
  };
  // A repeated submission is not forwarded to P5 at all.
  assert.deepEqual(await run(null), { sent: [SHARED, OTHER], basis: "not-forwarded" });
  assert.deepEqual(await run(undefined), { sent: [SHARED, OTHER], basis: "not-forwarded" });
  assert.deepEqual(await run(Promise.reject(new Error("bridge threw"))), { sent: [SHARED, OTHER], basis: "unknown" });
  assert.deepEqual(await run(Promise.resolve(undefined as unknown as P5BridgeResult)), { sent: [SHARED, OTHER], basis: "unknown" });
  assert.deepEqual(
    await run(Promise.resolve({ forwarded: true, alert: "yes" } as unknown as P5BridgeResult)),
    { sent: [SHARED, OTHER], basis: "unknown" },
  );
});

test("the team email waits for the bridge result, and a send failure is still reported", async () => {
  let answer: (result: P5BridgeResult) => void = () => undefined;
  const sent: string[] = [];
  const pending = sendSiteTeamEmail({
    bridge: new Promise<P5BridgeResult>((resolve) => {
      answer = resolve;
    }),
    label: "test",
    recipients: async () => [SHARED, OTHER],
    send: async (to) => {
      sent.push(to);
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(sent, [], "nothing is sent while P5 has not answered");
  answer({ forwarded: true, alert: "failed" });
  await pending;
  assert.deepEqual(sent, [SHARED, OTHER]);

  // Exactly as before: a provider error is thrown so the channel is recorded as failed.
  await assert.rejects(
    sendSiteTeamEmail({
      bridge: null,
      label: "test",
      recipients: async () => [SHARED],
      send: async () => {
        throw new Error("Admin email failed: provider down");
      },
    }),
    /provider down/,
  );
});

/** The estimate the route would verify, priced by the real engine. */
function estimateFor(project: ProjectType, finish: FinishLevel, sqft: number, statedBudget: number | null = null): VerifiedEstimate {
  const refinements = { ...EMPTY_REFINEMENTS };
  const guide = calculateEstimate({ project, finish, sqft, refinements }, 0);
  const range = resolveQuotedRange(project, finish, sqft, refinements, 0);
  return {
    project,
    finish,
    sqft,
    priceLow: (range ?? guide).priceLow,
    priceHigh: (range ?? guide).priceHigh,
    roi: guide.roi,
    confidence: guide.confidenceLabel,
    statedBudget,
    refinements,
    included: guide.included,
  };
}

const sampleEstimate = () => estimateFor("custom-home", "mid-range", 2400, 650_000);

const PROFILE = {
  county: "ada" as const,
  parcelId: "R1234567890",
  lotSizeSqFt: 9148,
  lotSizeAcres: 0.21,
  zoning: "R-1C",
  zoningCategory: "Residential",
  subdivision: "Sample Ridge No. 2",
  ownerName: "SAMPLE AVERY",
  ownerOccupied: true,
  assessedValue: 512_300,
  permittingAuthority: "City of Boise",
};

const ATTRIBUTION = sanitizeAttribution({
  version: 1,
  consent: { analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" },
  first: {
    at: "2026-11-10T17:00:00.000Z",
    landing: "https://www.boiseconstruction.co/custom-homes",
    referrer: "https://www.google.com",
    campaign: { utm_source: "google", utm_medium: "cpc", utm_campaign: "custom-homes", keyword: "custom home builder boise" },
    clickIds: { gclid: "test-click-id" },
  },
  latest: {
    at: "2026-11-16T19:30:00.000Z",
    landing: "https://www.boiseconstruction.co/estimate",
    referrer: "",
    campaign: {},
    clickIds: {},
  },
});

function assertWellFormed(notes: unknown) {
  assert.ok(Array.isArray(notes), "team_notes is an array");
  const lines = notes as unknown[];
  assert.ok(lines.length > 0 && lines.length <= P5_TEAM_NOTES_MAX_LINES, `${lines.length} lines`);
  for (const line of lines) {
    assert.equal(typeof line, "string");
    const text = line as string;
    assert.ok(text.length <= P5_TEAM_NOTE_MAX_LENGTH, `too long: ${text}`);
    assert.doesNotMatch(text, /[\r\n\t\u0000-\u001f]/, `not a single line: ${JSON.stringify(text)}`);
    assert.match(text, /^[^:]{1,80}: \S/, `not "Label: value": ${text}`);
    assert.equal(text, text.trim());
  }
}

test("the bridge body asks P5 to confirm and carries well-formed team notes", async () => {
  assert.ok(ATTRIBUTION, "the sample attribution is valid");
  const teamNotes = buildConsultationTeamNotes({ estimate: sampleEstimate(), profile: PROFILE, attribution: ATTRIBUTION });
  let posted: Record<string, unknown> = {};
  const result = await forwardConsultationToP5Intake(
    { ...LEAD, email: "avery@example.com", message: "Custom home on land we own near Star.", submissionKind: "initial", requestKind: "quote", teamNotes },
    async (_url, init) => {
      posted = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ ok: true, alert: "sent" }), { status: 201 });
    },
  );
  assert.deepEqual(result, { forwarded: true, alert: "sent" });
  assert.equal(posted.team_alert, "confirm");
  assertWellFormed(posted.team_notes);
  const notes = posted.team_notes as string[];
  const estimate = sampleEstimate();

  // What this site's own team email shows and the bridge fields do not.
  assert.equal(notes[0], `Lead dashboard: ${LEADS_DASHBOARD_URL}`);
  assert.equal(
    notes[1],
    `Planning range shown: $${estimate.priceLow.toLocaleString("en-US")} to $${estimate.priceHigh.toLocaleString("en-US")} (${estimate.confidence})`,
    "the range is the one the customer was shown",
  );
  assert.ok(notes.includes("Stated budget: $650,000"));
  assert.ok(notes.includes("Range is for: Custom Home"));
  assert.ok(notes.includes("Approx. size: 2,400 sq ft"));
  assert.ok(notes.includes("Parcel: R1234567890"));
  assert.ok(notes.includes("Zoning: R-1C (Residential)"));
  assert.ok(notes.includes("Lot: 0.21 acres (9,148 sq ft)"));
  assert.ok(notes.includes("Permits: City of Boise"));
  assert.ok(notes.includes("How they found us (browser reported): direct visit"));
  assert.ok(notes.includes("How they found us (browser reported), landing page: https://www.boiseconstruction.co/estimate"));
  assert.ok(notes.includes("First visit 2026-11-10 (browser reported): Google Ads click"));
  assert.ok(notes.includes("First visit 2026-11-10 (browser reported), utm_campaign: custom-homes"));
  assert.ok(notes.includes("First visit 2026-11-10 (browser reported), keyword: custom home builder boise"));
  assert.ok(notes.includes("First visit 2026-11-10 (browser reported), referrer: https://www.google.com"));
  assert.equal(notes.some((line) => line.includes("test-click-id")), false, "click ids stay out of the email");

  // Nothing the bridge already sends is repeated.
  for (const repeated of ["Avery Sample", "555-0142", "avery@example.com", "near Star"]) {
    assert.equal(notes.some((line) => line.includes(repeated)), false, repeated);
  }
  assert.equal(notes.some((line) => /^(Name|Phone|Email|Address|Project type|Message):/.test(line)), false);
});

/**
 * The P5 team email is copied into HubSpot with its full body, and costs and
 * margins stay out of HubSpot. So the notes may carry the range the customer
 * was shown, their selections, the parcel record and the dashboard link, and
 * never what a job costs us, a margin, a markup, a profit, a contingency or an
 * overhead number. P5 drops any line that mentions those words too.
 */
test("team notes for a request with a planning range never carry an internal figure", () => {
  const FINISHES: FinishLevel[] = ["refresh", "mid-range", "high-end", "luxury"];
  let estimates = 0;
  let withChecks = 0;
  for (const project of Object.keys(PROJECT_LABELS) as ProjectType[]) {
    const size = getProjectSizeConfig(project);
    for (const finish of FINISHES) {
      for (const sqft of [size.min, Math.round((size.min + size.max) / 2), size.max]) {
        let estimate: VerifiedEstimate;
        try {
          estimate = estimateFor(project, finish, sqft, Math.round(sqft * 180));
        } catch {
          continue; // not every finish level exists for every project
        }
        estimates += 1;
        const notes = buildConsultationTeamNotes({ estimate, profile: PROFILE, attribution: ATTRIBUTION });
        const where = `${project} ${finish} ${sqft}`;
        assertWellFormed(notes);
        for (const line of notes) {
          assert.equal(mentionsInternalFigure(line), false, `${where}: ${line}`);
        }

        // The range and every selection the customer made are all there: the
        // rule is met by not building internal lines, not by filtering good ones away.
        assert.ok(notes.some((line) => line.startsWith("Planning range shown: $")), where);
        const selections = buildSelectionRows(project, finish, sqft, estimate.refinements);
        for (const row of selections) {
          const label = row.label === "Project type" ? "Range is for" : row.label;
          assert.ok(notes.includes(`${label}: ${row.value}`), `${where}: selection "${row.label}" is missing`);
        }

        // Every dollar amount in the notes is one the customer or the county
        // gave us: the range ends, the stated budget, the assessed value.
        const allowed = new Set([estimate.priceLow, estimate.priceHigh, estimate.statedBudget, PROFILE.assessedValue]);
        for (const line of notes) {
          for (const match of line.matchAll(/\$([\d,]+)/g)) {
            assert.ok(allowed.has(Number(match[1].replace(/,/g, ""))), `${where}: unexpected amount in "${line}"`);
          }
        }

        // Pricing checks name margins. Their text never leaves this site; a count at most.
        const checks = resolveInternalEstimate(project, finish, sqft, estimate.refinements)?.admin.warnings ?? [];
        const checkLines = notes.filter((line) => line.startsWith("Pricing checks on this range: "));
        if (checks.length) {
          withChecks += 1;
          assert.equal(checkLines.length, 1, where);
          assert.match(checkLines[0], new RegExp(`^Pricing checks on this range: ${checks.length}(, \\d+ to review before quoting)? \\(not listed in this email\\)$`));
          for (const check of checks) {
            assert.equal(notes.some((line) => line.includes(check.message.slice(0, 20))), false, `${where}: check text leaked`);
          }
          // This site's own team email still shows them in full, which is why it is the fallback.
          const adminHtml = buildAdminEmailHtml({ name: "Avery Sample", phone: "2085550142", email: "", address: "", projectType: project }, estimate, PROFILE, {});
          assert.match(adminHtml, /Internal breakdown \(not shown to the lead\)/);
        } else {
          assert.equal(checkLines.length, 0, where);
        }
      }
    }
  }
  assert.ok(estimates >= 30, `only ${estimates} estimates were checked`);
  assert.ok(withChecks > 0, "at least one priced range raised a pricing check, so the count line was exercised");

  // The backstop: a line that names an internal figure is left out whoever built it.
  for (const word of ["cost", "Costs", "margin", "markup", "mark-up", "gross profit", "contingency", "overhead"]) {
    assert.match(`Our ${word}: 12`, INTERNAL_FIGURE_WORDS, word);
  }
  const leaky = buildConsultationTeamNotes({
    attribution: sanitizeAttribution({
      version: 1,
      consent: { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" },
      first: { at: "2026-11-16T19:30:00.000Z", landing: "https://www.boiseconstruction.co/blog/cost-to-build-a-home", referrer: "", campaign: { utm_source: "google", keyword: "custom home cost boise" }, clickIds: {} },
      latest: { at: "2026-11-16T19:30:00.000Z", landing: "https://www.boiseconstruction.co/blog/cost-to-build-a-home", referrer: "", campaign: { utm_source: "google", keyword: "custom home cost boise" }, clickIds: {} },
    }),
  });
  assert.deepEqual(leaky, [
    `Lead dashboard: ${LEADS_DASHBOARD_URL}`,
    "How they found us (browser reported): campaign link",
    "How they found us (browser reported), utm_source: google",
  ]);
});

test("a long list names what it left out instead of losing its tail", () => {
  const lines = Array.from({ length: 55 }, (_, i) => `Line ${i}: value`);
  const fitted = fitTeamNotes(lines);
  assert.equal(fitted.length, P5_TEAM_NOTES_MAX_LINES);
  assert.deepEqual(fitted.slice(0, 39), lines.slice(0, 39));
  assert.equal(fitted.at(-1), "Not shown: 16 more lines, the full record is on the lead dashboard");
  assertWellFormed(fitted);
  assert.deepEqual(fitTeamNotes(lines.slice(0, 40)), lines.slice(0, 40), "exactly at the limit nothing is replaced");
  // A line that names an internal figure is left out before anything is counted.
  assert.deepEqual(fitTeamNotes(["Parcel: R1", "Total internal cost: $1", "Margin: 28%", "  ", "Zoning: R-1C"]), ["Parcel: R1", "Zoning: R-1C"]);
});

test("team notes without an estimate, and for the details step, stay short and true", () => {
  assert.deepEqual(buildConsultationTeamNotes({}), [`Lead dashboard: ${LEADS_DASHBOARD_URL}`]);
  assert.deepEqual(buildConsultationTeamNotes({ estimate: null, profile: null, attribution: undefined }), [
    `Lead dashboard: ${LEADS_DASHBOARD_URL}`,
  ]);
  const callback = buildP5IntakePayload({ ...LEAD, requestKind: "callback", preferredContact: "phone", teamNotes: buildConsultationTeamNotes({}) });
  assert.equal(callback.team_alert, "confirm");
  assert.deepEqual(callback.team_notes, [`Lead dashboard: ${LEADS_DASHBOARD_URL}`]);

  const details = buildDetailsTeamNotes({ profile: PROFILE });
  assertWellFormed(details);
  assert.equal(details[0], `Lead dashboard: ${LEADS_DASHBOARD_URL}`);
  assert.ok(details.includes("Parcel: R1234567890"));
  assert.ok(details.includes("Assessed value: $512,300"));
  assert.deepEqual(buildDetailsTeamNotes({}), [`Lead dashboard: ${LEADS_DASHBOARD_URL}`]);

  // A profile the parcel lookup did not fill, or one that cannot be read, costs only its own lines.
  assert.deepEqual(buildDetailsTeamNotes({ profile: { lotSizeAcres: "0.21" } as never }), [`Lead dashboard: ${LEADS_DASHBOARD_URL}`]);

  // Without notes the field is left off, and the confirmation is still requested.
  const bare = buildP5IntakePayload(LEAD);
  assert.equal(bare.team_alert, "confirm");
  assert.equal("team_notes" in bare, false);
});

test("team notes are forced into the contract whatever a caller passes", () => {
  const long = `Notes: ${"x".repeat(500)}`;
  const cleaned = sanitizeTeamNotes([
    "  Lead dashboard:   https://example.com  ",
    "Two\nlines:\tone value\r\nhere",
    "",
    "   ",
    long,
    42 as unknown as string,
    null as unknown as string,
  ]);
  assert.deepEqual(cleaned.slice(0, 2), ["Lead dashboard: https://example.com", "Two lines: one value here"]);
  assert.equal(cleaned.length, 3);
  assert.equal(cleaned[2].length, P5_TEAM_NOTE_MAX_LENGTH);
  assert.ok(cleaned[2].endsWith("..."));
  assert.equal(sanitizeTeamNotes(Array.from({ length: 90 }, (_, i) => `Line ${i}: value`)).length, P5_TEAM_NOTES_MAX_LINES);
  assert.deepEqual(sanitizeTeamNotes(undefined), []);
  assert.deepEqual(sanitizeTeamNotes(null), []);
});
