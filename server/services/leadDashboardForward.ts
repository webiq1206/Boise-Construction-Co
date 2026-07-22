import type { LeadEstimateRecord } from "@/server/services/leadRecord";

/**
 * Fire-and-forget forwarding to the Boise Remodeling lead dashboard.
 * Never throws or awaits -- a failure here must never affect the API response.
 *
 * FIELD NAMES ARE A CONTRACT. The dashboard validates with a plain zod object,
 * which strips unknown keys, so a field named even slightly differently is
 * silently discarded rather than rejected. These names match
 * `externalLeadSchema` in the BRC-Lead-Dashboard repo exactly. Verified against
 * that source: fullName and email are required, everything else optional.
 */

/** finalNotes is capped at 2000 chars by the dashboard; exceeding it 400s the
 *  whole submission, so the readable record is trimmed to fit. The complete,
 *  untrimmed record still travels in `estimate` and is persisted server-side. */
const FINAL_NOTES_LIMIT = 1990;
const PROJECT_SCOPE_LIMIT = 1990;

function clamp(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 20)}\n...[truncated]`;
}

interface ForwardPayload {
  /* Required by the dashboard */
  fullName: string;
  email: string;

  /* Contact + property, named exactly as the dashboard expects */
  phone?: string;
  propertyAddress?: string;
  city?: string;
  state?: string;
  zip?: string;

  /* Project fields */
  projectTypes?: string[];
  budgetRange?: string;
  projectScope?: string;
  projectGoals?: string;
  finalNotes?: string;

  source?: string;

  /**
   * The complete structured record. The dashboard strips this today; it is sent
   * so that once the endpoint persists the raw payload (see sourcePayload in its
   * leads table) nothing has to change on this side.
   */
  estimate?: LeadEstimateRecord;
}

export function forwardToLeadDashboard(payload: ForwardPayload): void {
  const key = process.env.LEAD_DASHBOARD_KEY;
  if (!key) {
    console.warn(
      "[lead-dashboard] LEAD_DASHBOARD_KEY is not set; lead was NOT forwarded to the CRM."
    );
    return;
  }

  const body: ForwardPayload = {
    ...payload,
    finalNotes: payload.finalNotes ? clamp(payload.finalNotes, FINAL_NOTES_LIMIT) : undefined,
    projectScope: payload.projectScope ? clamp(payload.projectScope, PROJECT_SCOPE_LIMIT) : undefined,
  };

  fetch("https://leads.boiseremodeling.co/api/external/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      // A rejected forward means the lead reached the inbox but not the CRM.
      // 409 is the dashboard's 60-second duplicate guard and is expected when a
      // visitor submits twice, so it is noted rather than flagged as an error.
      if (res.status === 409) {
        console.info("[lead-dashboard] Duplicate within 60s; CRM kept the existing lead.");
        return;
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(
          `[lead-dashboard] Forward rejected: ${res.status} ${res.statusText} ${detail.slice(0, 300)}`
        );
      }
    })
    .catch((err) => console.error("[lead-dashboard] Forward failed:", err));
}
