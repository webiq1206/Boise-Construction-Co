# 02 - Google Business Profile Plan

Status: profile created but **unverified/suspended**. This is the single highest-impact item in the entire audit - without a live GBP there is no Local Pack, no Maps, no review collection, and weakened AI-engine entity confidence. Everything below is sequenced: recover first, then optimize.

## Part 1 - Verification / suspension recovery

Boise Remodeling Co is a **Service Area Business (SAB)**: address hidden, serves customers at their locations. SABs in home services are the most-suspended GBP category. Follow exactly:

1. **Audit the profile before resubmitting.** Sign in at business.google.com. Confirm every field matches the canonical NAP below - mismatches between submission attempts are a common suspension trigger:
   - Name: `Boise Remodeling Co` - exactly. No "LLC", no "| Kitchen & Bath", no city keyword stuffing (instant suspension risk).
   - Phone: `(208) 477-1169`
   - Website: `https://boiseremodeling.co`
   - Address: enter the real physical address (required for verification even when hidden), then **clear the address** / set "I deliver goods and services to my customers" so only the service area shows publicly.
   - Service area: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, ID (max 20 areas allowed; these 8 match `BUSINESS_INFO.serviceArea` exactly - keep them in sync forever).
2. **If suspended**: submit the [reinstatement request form](https://support.google.com/business/troubleshooter/2690129) once - duplicate submissions reset the queue. Attach in one PDF: Idaho business registration for Boise Remodeling Co LLC (Secretary of State certificate), proof of insurance/bond naming the business, a utility bill or lease at the registered address, and vehicle/signage photos if available.
3. **If unverified**: expect **video verification** (standard for SABs since 2023). Prepare a single continuous video showing: business registration document, branded equipment/vehicle, tools of the trade, and proof of the address (mail or signage). Do the recording at the registered address.
4. **While waiting** (do not skip - these strengthen the entity Google checks against):
   - Ensure the Facebook (facebook.com/boiseremodeling) and Instagram pages display the same NAP.
   - Fix the ProMatcher citation (see 07-nap-citations.md) - a conflicting Lake Fork, ID address on the open web is exactly the kind of signal that keeps a verification in review.
   - Create Bing Places and Apple Business Connect listings with identical NAP (both verify faster than Google and become corroborating citations).

## Part 2 - Profile specification (apply immediately on verification)

### Categories
- **Primary: `Remodeler`** - matches the design-build positioning and the five services better than `General contractor` (which signals new construction + commercial and dilutes Local Pack relevance for "remodeling" queries).
- Secondary, in this order: `Kitchen remodeler`, `Bathroom remodeler`, `Construction company`, `General contractor`, `Design agency` (only if design-build consultations are sold separately; otherwise omit).

### Business description (750 chars max; first 250 matter most)
> Boise Remodeling Co is a design-build remodeling contractor serving Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, Idaho. One accountable team handles design, Ada and Canyon County permits, and construction for kitchen remodels, bathroom remodels, whole-home renovations, room additions, and ADUs. Every project includes a written scope before construction, a dedicated project manager, weekly written progress updates, and a written workmanship guarantee. Founded in 2017. Bonded and insured. Schedule a free 60 to 90 minute in-home visit and leave with a planning range and design direction - no pressure, no obligation.

### Services (add each under the matching category; pull descriptions from `shared/contentData.ts`)
- Kitchen remodeling - "Custom kitchen renovations from cabinet refreshes to full gut-and-rebuild."
- Bathroom remodeling - "Spa-quality bathroom transformations designed around how you actually live."
- Whole-home remodeling - "Cohesive whole-home renovations with a single project manager start to finish."
- Room additions - "Thoughtfully designed additions that feel like they were always part of your home."
- ADU construction - "Detached or attached accessory dwelling units designed to maximize property value."
- Also add as services (free-text): Design-build services, Remodeling permit management, Home renovation consultation, Primary suite additions, Garage conversions, Basement finishing (only if actually offered).

### Attributes
- Identifies as: set any that apply (veteran-owned etc. - only if true)
- `Online estimates: Yes` (the on-site estimator qualifies)
- `Onsite services: Yes`
- Payments: match `paymentAccepted` in schema (cash, check, credit card, financing)

### Links
- Website: `https://boiseremodeling.co`
- Appointment link: `https://boiseremodeling.co/contact`
- After verification, add the GBP listing URL + Maps short link to `BUSINESS_INFO.sameAs` in `lib/seo.ts` (plumbing is ready; this closes the entity loop).

### Photos (minimum viable set, week 1)
1. Logo (square) + cover photo (the hero remodel interior, 1200x900+)
2. 10+ project photos, captioned by city and project type before upload (filenames like `kitchen-remodel-boise-north-end-after.jpg` - Google reads them)
3. Team/founder photo, work-in-progress shots (dust barriers, floor protection - they visualize the differentiators)
4. Ongoing: 2-4 new photos per month, every completed project, geotagged where possible

### Q&A seeding (post and answer these yourself - it is allowed and expected)
1. "Do you provide free estimates?" → free 60-90 min in-home visit + online planning-range estimator
2. "What areas do you serve?" → the 8 cities verbatim
3. "Do you handle permits?" → yes, Ada and Canyon County, in-house
4. "How much does a kitchen remodel cost?" → planning bands from the estimator ($15k-$35k refresh to $150k+ luxury), link to cost guide
5. "Are you licensed and insured?" → bonded + insured (add license number once displayed on site; see 11-eeat-audit.md)
6. "Do you build ADUs?" → yes, attached and detached, including Boise ordinance guidance

### Posts cadence
- Weekly "Update" post alternating: project showcase (city-tagged), cost/planning tip linking to a guide, seasonal angle, review highlight.
- Every post links to a deep page (guide or city-service), never just the homepage.

### Reviews
Begin collection the day verification lands - the full system is in 08-review-strategy.md. Target: 10 reviews in 60 days, each mentioning city + service.

## Part 3 - Bing Places + Apple Business Connect (same week)
- Bing Places: import from GBP once verified (fastest path), or create manually with identical NAP. Categories: Remodeler / General Contractor.
- Apple Business Connect: register at businessconnect.apple.com with identical NAP; pick category `Home Improvement`. Apple Maps powers Siri voice results - relevant for "remodeling contractor near me" voice queries.

## GBP-to-website alignment checklist (keep in sync permanently)
- GBP service area == `BUSINESS_INFO.serviceArea` (8 cities) == `areaServed` schema
- GBP categories == services in `shared/contentData.ts` == `hasOfferCatalog`
- GBP hours == `BUSINESS_INFO.hours` == `openingHoursSpecification`
- GBP description claims (2017, written guarantee, weekly updates) == homepage copy
- GBP URL in `BUSINESS_INFO.sameAs` (after verification)
