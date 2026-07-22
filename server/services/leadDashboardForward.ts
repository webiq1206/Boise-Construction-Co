import type { LeadEstimateRecord } from "@/server/services/leadRecord";

/**
 * Fire-and-forget forwarding to the Boise Remodeling lead dashboard.
 * Never throws or awaits -- a failure here must never affect the API response.
 */

interface ForwardPayload {
  /* ── Fields the dashboard is already known to accept ─────────────────── */
  fullName: string;
  email: string;
  phone: string;
  projectTypes: string[];
  /** Property address. The team qualifies service area on this. */
  address?: string;
  budgetRange?: string;
  projectScope?: string;
  source: string;

  /* ── Full record of what the homeowner saw ───────────────────────────── */

  /**
   * Flattened headline figures. Carried at the top level as well as inside
   * `estimate`, because a CRM is far more likely to have somewhere to map a
   * single number or string than a nested object.
   */
  estimateLow?: number;
  estimateHigh?: number;
  estimateRange?: string;
  estimateConfidence?: string;
  propertyZip?: string;

  /** The complete structured record: selections, scope, assumptions, disclaimers. */
  estimate?: LeadEstimateRecord;

  /**
   * The same record rendered as readable text. The dashboard's field schema is
   * not known from this repository, so any structured field it does not
   * recognise may be discarded. This string is the guarantee that the complete
   * record lands somewhere legible on every lead, in a consistent shape.
   */
  notes?: string;
}

export function forwardToLeadDashboard(payload: ForwardPayload): void {
  const key = process.env.LEAD_DASHBOARD_KEY;
  if (!key) {
    return;
  }

  fetch("https://leads.boiseremodeling.co/api/external/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      // A rejected forward means the lead reached the inbox but not the CRM.
      // That is worth a loud log rather than silence, since the two records
      // would otherwise drift apart without anyone noticing.
      if (!res.ok) {
        console.error(
          `[lead-dashboard] Forward rejected: ${res.status} ${res.statusText}`
        );
      }
    })
    .catch((err) => console.error("[lead-dashboard] Forward failed:", err));
}
