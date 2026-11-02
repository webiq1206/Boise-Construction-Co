# Boise Construction lead attribution

## Boundaries

The business phone remains (208) 477-1169. Google forwarding numbers are temporary visitor-specific routing, never business records. A synthetic record's Caldwell address is not company address evidence. No campaign, budget, conversion action, primary/secondary goal or threshold is changed by this implementation.

Existing GA4 and AW-18354188204 labels remain unchanged. Phone clicks remain contact intent, not call conversions. Google determines forwarding eligibility and measures the existing call-duration conversion; the app never emits that conversion on a click. See https://support.google.com/google-ads/answer/6095883.

## Consent

The early consent bridge defaults all four Google consent signals to denied. An actual consent manager must call standard gtag consent update or window.p5UpdateConsent with the user's choices on every document. No banner or invented grant is added. Without that integration, persistent attribution and forwarding-number requests remain disabled. This is an explicit rollout dependency, not evidence of consent.

Before consent, landing evidence remains in document memory. Only origin/path and referrer origin accompany a submission without consent. Analytics consent permits bounded first/latest campaign persistence for 90 days; click IDs additionally require ad_storage and ad_user_data. Revocation clears persisted acquisition and identifiers. Storage failure never blocks a form. Cookies, arbitrary URL queries, fragments, credentials and referrer search terms are excluded.

## Existing intake contracts

The consultation JSON request carries optional hidden attribution metadata. It is server-sanitized and stored under property_profile._leadAttribution (existing JSON storage; no schema migration). This namespaced envelope is not a property address. The same evidence is appended to the existing CRM estimateSummary when it fits the forwarder's 19,900-character safety limit; otherwise the full original notes are preserved and attribution remains in the local lead record. Existing delivery keys and conversion claims are unchanged.

P5's accepted immutable intake snapshot carries optional attribution. The canonical strict HubSpot receiver contract does not permit new properties; evidence is projected into one explicitly labelled acquisition transcript entry on the same keyed project-review payload. Customer conversations and customer emails are not modified. A full 500-entry transcript is preserved rather than truncated; acquisition remains saved locally in that exceptional case. Actual remote HubSpot property mapping/retention still requires a receiver-side read-only verification. No separate CRM lead or call record is created.

Attribution is browser-reported and can be spoofed. UTM and click IDs are evidence, not verified Google Ads activity or actual call origin. Organic/referral/direct visits are not relabelled paid. No account settings, production leads, provider sends or ad clicks are needed for automated QA.

## Shared-engine provenance

This brand's requested integration extends the shared intake snapshot, endpoint and CRM projection plus its estimator submission. The shared manifest records the exact local extension hashes and names the upstream base; this is not an upstream synchronization claim. Promote these small changes, including the two attribution dependencies, into the canonical shared engine before the next multi-brand sync to avoid dropping them.

## QA and limitations

Run node --import tsx --test tests/lead-attribution.test.ts tests/analytics-bootstrap.test.ts tests/p5-intake-project-review.test.ts.
Run the existing scripts/p5-estimator-browser.mjs with its intercepted APIs, and playwright test e2e/lead-attribution.spec.ts with the Nix browser override.

Google issuing a real forwarding number and recording a 60-second call cannot be proved by a mocked callback. Do not enable campaigns or spend for this check. Consent manager integration and a separately authorized real-provider verification are prerequisites to claiming end-to-end production measurement.
