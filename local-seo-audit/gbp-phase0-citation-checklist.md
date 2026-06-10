# GBP Phase 0 — Citation & NAP Cleanup Checklist

Complete **before** submitting GBP verification. Stale citations with `(208) 405-8425` and a Lake Fork, ID address are actively corrupting entity signals.

**Canonical NAP** (from [shared/gbpProfile.ts](../shared/gbpProfile.ts)):

- Name: `Boise Remodeling Co`
- Phone: `(208) 477-1169`
- Email: `hello@boiseremodeling.co`
- Website: `https://boiseremodeling.co`
- Public locality: `Meridian, ID` (service-area business — no street address published)

## Checklist

- [ ] **Yelp** — Search Yelp for "Boise Remodeling Co". Claim listing. Set phone to `(208) 477-1169`. Use service-area model. Remove/suppress any street address. Set website to `https://boiseremodeling.co`. After live, set `NEXT_PUBLIC_YELP_URL` in env → activates in schema `sameAs`.
- [ ] **ProMatcher** — Correct or delete [promatcher.com/profile/BoiseRemodelingCo](https://www.promatcher.com/profile/BoiseRemodelingCo). Remove Lake Fork address and old phone `(208) 405-8425`. Deletion is acceptable.
- [ ] **Facebook** — [facebook.com/boiseremodeling](https://www.facebook.com/boiseremodeling): confirm name, phone, website, and category (Home Improvement) match canonical NAP. Site footer now links to this page.
- [ ] **Instagram** — [instagram.com/boiseremodeling](https://www.instagram.com/boiseremodeling): confirm bio NAP matches. Site footer now links to this page.
- [ ] **MapQuest** — Submit correction after Yelp is fixed ([mapquest.com listing](https://www.mapquest.com/us/idaho/boise-remodeling-co-519905114) syndicates from Yelp).
- [ ] **GBP draft audit** — Sign in at [business.google.com](https://business.google.com). Confirm every field matches canonical NAP before verifying.

## Verification search (30 days after fixes)

Run: `"Boise Remodeling Co" (208) 405-8425`

Expected: **no live results** with the old number.

See also: [07-nap-citations.md](./07-nap-citations.md)
