"use client";

/**
 * Sends the framed estimator's events to this site's own analytics.
 *
 * EstimatorFrame.tsx repeats each estimator event on this page as a
 * "p5-estimator-event" window event. This component listens and forwards every
 * one to GA4 through trackEvent, with the brand and project only. No contact
 * detail ever reaches this page, so none is sent.
 *
 * estimator_completed is the one accepted lead: the estimator has taken the
 * visitor's contact details and shown the range. On that event only, and once
 * per page view, this also sends the lead conversion the quote form sends after
 * the API accepts a request: GA4 generate_lead, the Google Ads lead conversion
 * and the Meta Lead event, labelled instant_estimator.
 *
 * The quote form's helper (trackClaimedLeadConversion) first claims a
 * server-issued inquiry key from /api/inquiry-conversion. The estimator's lead
 * is stored by the estimator, not by this site, so there is no key to claim:
 * generate_lead goes through the plain trackEvent helper, and the two ad
 * conversions go through the same unclaimed helpers the claimed one calls,
 * with one browser-made id shared by all three.
 */

import { useEffect, useRef } from "react";
import { trackEvent, trackGoogleAdsLead, trackMetaEvent } from "@/lib/analytics";
import type { EstimatorEventDetail } from "./EstimatorFrame";

const EVENT_NAME = /^estimator_[a-z_]{1,40}$/;
const LEAD_EVENT = "estimator_completed";
const LEAD_SOURCE = "instant_estimator";

function leadId(): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${LEAD_SOURCE}:${random}`;
}

export default function EstimatorAnalytics() {
  const leadSent = useRef(false);

  useEffect(() => {
    const onEstimatorEvent = (event: Event) => {
      const detail = (event as CustomEvent<Partial<EstimatorEventDetail> | null>).detail;
      if (!detail || typeof detail.name !== "string" || !EVENT_NAME.test(detail.name)) return;
      const brand = typeof detail.brand === "string" ? detail.brand : "";
      const project = typeof detail.project === "string" ? detail.project : "";

      trackEvent(detail.name, { estimator_brand: brand, estimator_project: project });

      // A lead conversion is sent for a finished estimate only, once per page view.
      if (detail.name !== LEAD_EVENT || leadSent.current) return;
      leadSent.current = true;
      const id = leadId();
      const projectType = project || "unknown";
      trackEvent("generate_lead", {
        form: LEAD_SOURCE,
        lead_source: LEAD_SOURCE,
        project_type: projectType,
        estimator_brand: brand,
        estimator_project: project,
        event_id: id,
      });
      trackGoogleAdsLead(id, { projectType });
      trackMetaEvent("Lead", { content_name: projectType, content_category: LEAD_SOURCE }, undefined, id);
    };

    window.addEventListener("p5-estimator-event", onEstimatorEvent);
    return () => window.removeEventListener("p5-estimator-event", onEstimatorEvent);
  }, []);

  return null;
}
