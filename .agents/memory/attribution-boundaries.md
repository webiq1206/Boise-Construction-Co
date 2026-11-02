---
name: Lead attribution boundaries
description: User constraints for P5 Google Ads attribution and safe verification.
---
Keep existing form UX, phone, CRM handoff and staff process unchanged. A Caldwell address in a synthetic CRM test is not company address evidence. Temporary Google forwarding numbers are not business lines; not all calls are Google Ads leads.

**Why:** The user explicitly warned against those attribution and business-identity mistakes.

**How to apply:** Use only source-supported acquisition evidence. Do not enable campaigns or spend for QA. A simulated callback does not prove Google issued a forwarding number or recorded a duration-qualified call.

Consent defaults and persistent acquisition require separate handling: pending consent on a new document must not erase previously consented first-touch evidence before a delayed consent manager responds.

**Why:** A consent manager can respond after client hydration. Treating the initial denied default as an explicit revocation loses valid first touch on navigation.

**How to apply:** Keep pending evidence in memory; read persistent attribution only after consent, and clear it on explicit revocation.
