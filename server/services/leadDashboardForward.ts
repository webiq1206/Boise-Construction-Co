/**
 * Fire-and-forget forwarding to the Boise Remodeling lead dashboard.
 * Never throws or awaits -- a failure here must never affect the API response.
 */

interface ForwardPayload {
  fullName: string;
  email: string;
  phone: string;
  projectTypes: string[];
  budgetRange?: string;
  projectScope?: string;
  source: string;
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
  }).catch((err) => console.error("[lead-dashboard] Forward failed:", err));
}
