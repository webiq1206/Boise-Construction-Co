# Boise Handyman Co and Boise Construction Co: Ranking Diagnosis and SEO / AEO / GEO Action Plan

Prepared 2026-10-20. Sites: boisehandyman.co, boiseconstruction.co. Comparison sites: boiseremodeling.co, boisecabinet.co.

## 1. Bottom line

Your two lagging sites are not held back by technical SEO. They are built on the same codebase as the two sites that rank #1, and they pass the same checks. The gap is almost certainly in three places that code cannot fix:

1. **Local trust signals are missing** (no Google reviews, no confirmed Google Business Profile, no backlinks). "Boise handyman" is a map-pack and franchise-dominated search. Reviews and a verified profile decide it.
2. **The keywords are harder or ambiguous.** "Boise handyman" is crowded with franchises and marketplaces. "Boise construction" is a mixed-intent term (news, commercial contractors, jobs) and your site is a residential home builder.
3. **Brand-new domains with heavy programmatic page counts.** About 42 percent of the handyman sitemap and 45 percent of the construction sitemap are city-by-service pages. That is a doorway pattern Google tends to discount on domains with no authority yet.

Page one is realistic for "boise handyman" and for "boise home builder" style terms. The bare head term "boise construction" is a longer, less certain play, and I recommend chasing buyer-intent terms first (section 6).

## 2. What I verified and what I could not

**Verified (live fetches and repo review):**

| Check | Result |
|---|---|
| robots.txt | Clean. All search and 21 AI crawlers named and allowed on both sites. |
| Sitemaps | Handyman 151 URLs, construction 160 URLs. Valid. |
| llms.txt | Live and current on handyman (updated 2026-10-17). |
| Titles and meta | Handyman and construction titles lead with the commercial term (for example "Handyman in Boise, Idaho"). |
| Duplicate content across your sites | Not an issue. Same-slug articles compare at 4 to 11 percent text similarity, so each site has its own writing. |
| Reviews | Handyman code sets `rating: 0` and `reviewCount: 0`. No AggregateRating can be emitted. |
| Shared identity | All brands use the same phone (208) 477-1169, same Meridian address (4031 W Wapoot St), same legal entity (P5 Home Co LLC), same public representative. |
| Stale planning files | The handyman repo's `seo-audit/` folder is the remodeling audit. Its keyword map targets "boise remodeling company". Its keyword research file is custom home builder research. No handyman-specific keyword or competitor work exists. |
| Programmatic share | Handyman 64 of 151 URLs (42 percent). Construction 72 of 160 (45 percent). Remodeling 60 of 200 (30 percent). |

**Could not verify (needs you):**

- **Rankings, impressions, indexation.** Your Ahrefs plan returned "Insufficient plan" for Site Explorer, Keywords Explorer, SERP Overview and Rank Tracker. My `site:` searches also returned nothing for boiseremodeling.co, which you say ranks #1, so that tool cannot confirm indexation. Treat anything about index status as unknown until you check Search Console.
- **Google Business Profile status** for any of the four brands.
- **Backlink counts and domain ages** for the four domains.
- **Why the winners win.** The explanations in section 1 are inferences. Section 3 gives a 30 minute test that settles it.

## 3. Confirm the diagnosis in 30 minutes

Run these before spending on fixes. The comparison between your two winners and two laggards is the answer.

1. **Search Console, all four properties.** For each: Pages report (indexed vs "Discovered, currently not indexed" vs "Crawled, currently not indexed"), and Performance for the target query (impressions, average position). A large "not indexed" bucket on the laggards points to quality and duplication filters. Impressions with a poor average position points to authority and local signals.
2. **URL Inspection** on each homepage and one city-by-service page. Confirm "URL is on Google" and the user-declared canonical matches Google's.
3. **Google Business Profile.** For each brand: does a verified profile exist, what is the category, how many reviews, does the phone and address match the site. Compare the winners to the laggards.
4. **Referring domains.** Ahrefs free Webmaster Tools or Bing Webmaster Tools backlink report for all four. Count unique referring domains.
5. **Search from Boise.** Use a Boise IP or Ahrefs Rank Tracker with a Boise location for "boise handyman", "handyman boise", "boise construction", "custom home builder boise". Record map pack and organic positions.
6. **Manual actions and security issues** in Search Console.
7. **FAQ check.** TinyFish extraction showed eight empty H3 headings under "Common questions" on both homepages. Open view-source on each homepage and confirm the FAQ question and answer text is in the raw HTML. If it is injected by JavaScript only, AI crawlers will miss it. Fix first if so.

## 4. Likely causes, ranked

| # | Cause | Confidence | Effect |
|---|---|---|---|
| 1 | No reviews and no confirmed GBP | High | No map pack presence. Map pack is the first thing shown for "boise handyman". |
| 2 | Zero or near-zero backlinks on new domains | High | Franchises (House Doctors, Handyman Connection, Handyman Matters, Ace) plus Thumbtack, TaskRabbit, TIDY, HomeAdvisor, BBB hold the page. |
| 3 | Intent mismatch on "boise construction" | High | Results are news (BoiseDev, KIVI, ENR, Idaho Business Review), directories and commercial contractors. Your page is a residential home builder. |
| 4 | Doorway-pattern page volume | Medium | 42 to 45 percent templated city-by-service pages dilute a young domain's quality signals. |
| 5 | Same phone, address and entity across five brands | Medium | Weakens each GBP, risks duplicate or suspended profiles, and ties the brands together in Google's entity graph. |
| 6 | Meridian address for Boise queries | Medium | Proximity matters in the map pack. The service-area address is about 8 miles from downtown Boise. |
| 7 | Handyman H1 lacks the word "handyman" | High, easy fix | Current H1: "Boise home repairs, fixed right in one trip." |
| 8 | Overlap between construction and remodeling | Low to medium | Additions and ADU content exists on both boiseconstruction.co and boiseremodeling.co. |
| 9 | Unverified trust claims | Medium (trust risk) | Construction hero says "Est. 2020". The handyman repo marks that same claim as unproven and hides it. P5 says "100+ projects". Verify or remove. |

## 5. Action plan

### Phase 0 (days 1 to 3): Decide and diagnose

- Run section 3.
- Owner decisions needed:
  - Does Boise Construction Co do **commercial or general construction**, or only residential home building? This decides the keyword strategy in section 6.
  - Will you name a responsible licensed person on About pages? You chose not to name anyone. The tradeoff is real: named experts are a trust signal for both Google and AI answers. Your call.
  - Which brand owns additions and ADUs: remodeling or construction? Pick one.

### Phase 1 (weeks 1 to 2): Entity and Google Business Profile foundation

1. **One GBP per brand, verified, correct category.**
   - Handyman: primary "Handyman", add "Home improvement contractor" only if true.
   - Construction: "Home builder" (and "General contractor" only if you do general work).
   - Business name must match the Idaho assumed business name registration and the website exactly. No keyword stuffing.
2. **Unique phone number per brand.** Five brands on one number looks like duplicates and cannot be told apart in citations or call tracking. Use a distinct local (208) number per brand, forwarded if needed, and keep it identical everywhere for that brand.
3. **Service-area business setup.** Hide the street address on the GBP, list the cities served. Do not use a virtual office or fake Boise address, which violates Google's rules and risks suspension.
4. **Put the GBP URL in `sameAs`** (set `NEXT_PUBLIC_GBP_URL` and `NEXT_PUBLIC_GBP_REVIEW_URL` in both repos) once live.
5. **Register Bing Places, Apple Business Connect, Yelp, Facebook, Nextdoor, BBB, Angi, Thumbtack, Houzz** (builder and cabinet brands), Alignable. Bing and Yelp feed ChatGPT and Siri style answers.
6. **Trust claims audit.** Remove or substantiate "Est. 2020" and "100+ projects". Publish the Idaho contractor registration number (the handyman repo already holds one) in the footer and About page for each brand.

### Phase 2 (weeks 1 to 4): On-page fixes

**Boise Handyman Co**

- Change the homepage H1 to include the term: for example "Boise handyman for small repairs, fixed right in one trip."
- Prune the programmatic layer. Keep indexable: Boise, Meridian, Eagle, Nampa, Garden City for the top four services (drywall, painting, plumbing, electrical) plus mounting. Set the rest to `noindex, follow` or fold them into the `/areas/{city}` page until the domain earns links and reviews. Target about 25 to 30 indexable programmatic pages, down from 64.
- Retire or rewrite off-topic posts that dilute topical focus (for example `boise-building-permit-guide`, `aging-in-place-home-design`).
- Strengthen the page that matches the head term: a deep `/areas/boise` page titled "Handyman in Boise, Idaho" with real Boise neighborhoods, a price table with dates, photos of finished Boise jobs, and a booking path.
- Double down on the unusual angle you already have: **RE-10 inspection repairs**. Realtors in Boise search for exactly this and few competitors target it. Build a short realtor landing page, a downloadable repair checklist, and a partner outreach list.
- Add genuine proof to every indexable page: dated job photos with Boise neighborhood captions, real testimonials with first name and city once reviews exist.

**Boise Construction Co**

- Retarget the homepage to the buyer-intent terms from your August Ahrefs pull (volume, KD): treasure valley home builders 200/23, custom home builder boise 150, home builders boise 150, boise home builders 100, new home construction boise 50/4, barndominium builders idaho 30/0, home builders nampa 100/40, home builders meridian 90/37.
- Add "construction" naturally to the homepage body and an H2 ("Boise construction, from lot to keys") so the entity associates with the head term without changing the real offering.
- If you do commercial work, create real commercial pages with project proof. If you do not, do not chase generic "boise construction" and accept it as a branded and secondary term.
- Remove overlap with remodeling: merge or retire `home-additions` and ADU content on the construction site, or rewrite them as ground-up only and link to boiseremodeling.co for existing-home work.
- Prune the 72 city-by-service pages the same way as handyman: keep Boise, Meridian, Eagle, Nampa for the three core services, noindex the rest.
- Rank-track "barndominium builders idaho" and "new home construction boise" as early wins (KD 0 and 4).

**Both sites**

- Fix the FAQ rendering if the check in section 3 shows it is client-side only.
- Replace the leftover remodeling files in `seo-audit/` with real keyword maps, competitor sets and metadata maps for each brand so future work targets the right terms.
- Keep one footer link between sibling brands at most. Avoid sitewide cross-links that read as a link network.

### Phase 3 (weeks 2 to 12): Reviews and authority

1. **Review engine.** After each completed job, text the customer a short link to the GBP review form. Target 15 real reviews in 30 days and 40 or more in 90 days per brand. Ask them to mention the job type and the neighborhood. Never buy, gate, or fabricate reviews.
2. **Show reviews on site** and switch on AggregateRating schema once real counts exist (the plumbing already exists in both repos).
3. **Links (target 20 to 30 quality referring domains per brand in 6 months):**
   - Local organizations: Boise Metro, Meridian and Eagle chambers, Building Contractors Association of Southwest Idaho, local HOA and property manager directories.
   - Partners: realtors and inspectors (RE-10 angle), mortgage brokers and land sellers (construction), interior designers, property managers.
   - Content that earns links: a dated "Boise handyman price index" (handyman) and a "Treasure Valley cost to build per square foot" report (construction), pitched to BoiseDev, Idaho Press, Idaho Business Review, Boise State and local real estate blogs.
   - Community: sponsor a local team or nonprofit (Habitat for Humanity Treasure Valley is a natural fit for builders) and request a link.
4. **Parent site.** p5homeco.com can pass a few legitimate links to each brand. Keep it to one clear link per brand.

### Phase 4 (weeks 4 to 12): AEO and GEO

The technical base is already strong (answer blocks, FAQ schema, llms.txt, all AI bots allowed). The gaps are off-site and verification.

1. **Third-party presence is what AI engines cite.** Yelp, Bing Places, BBB, Angi, Thumbtack, Nextdoor and local news carry more weight than your own site for "best handyman in Boise" style prompts. Complete Phase 1 step 5.
2. **Reddit.** r/Boise and r/BoiseID threads are cited often. Answer real questions with useful, disclosed, non-promotional advice. No astroturfing.
3. **Original data with dates.** Publish price tables with a visible "updated" date and a methodology line. AI systems quote concrete numbers.
4. **Entity consistency.** Same brand name, phone, address and description on every profile. Add `sameAs` links to every profile once live.
5. **Keep `llms.txt` current** after the pruning in Phase 2 so it lists only indexable pages.
6. **Monthly AI visibility test.** Run the prompt set below in ChatGPT, Perplexity, Gemini, Claude and Google AI Mode. Record whether each brand is mentioned, cited, and described correctly.

Prompt set (handyman): "best handyman in Boise", "who can fix drywall in Boise", "handyman for RE-10 repairs in Boise", "how much does a handyman cost in Boise", "handyman in Meridian Idaho", "who can mount a TV in Boise".

Prompt set (construction): "best custom home builders in Boise", "how much does it cost to build a house in Boise", "who builds barndominiums in Idaho", "home builders in Meridian Idaho", "how to choose a home builder in the Treasure Valley".

### Phase 5 (ongoing): Measurement

| Metric | Baseline | 30 days | 90 days | 180 days |
|---|---|---|---|---|
| Verified GBP | check | live | live | live |
| Google reviews per brand | 0 | 15 | 40 | 75 |
| Referring domains per brand | check | 5 | 15 | 30 |
| Indexed pages vs sitemap | check | 90 percent of kept pages | 95 percent | 95 percent |
| "boise handyman" map pack position | check | in top 20 | top 10 | top 3 |
| "boise handyman" organic position | check | top 50 | top 20 | top 10 |
| Buyer-intent construction terms (custom home builder boise etc.) | check | top 50 | top 20 | top 10 |
| "boise construction" organic position | check | top 100 | top 50 | top 20 to 30 |
| AI prompt mentions (of 6 or 5 prompts) | check | 1 | 2 | 3 |

These targets are planning estimates, not guarantees. Ranking depends on competitors, reviews you earn, and how fast links arrive.

## 6. How to treat each head term

**"Boise handyman"**: Winnable. Needs the map pack. Reviews and a verified GBP are the unlock, backed by about 20 referring domains and the pruned, higher-quality site. Plan on 4 to 9 months.

**"Boise construction"**: Mixed intent. It will reward a strong branded entity with a GBP named "Boise Construction Co", reviews, and a commercial footprint. If you only build homes, aim at "custom home builder boise", "home builders boise" and "new home construction boise" first, which have clearer intent and measurable volume. Treat the bare term as a 9 to 12 month stretch goal.

**Why remodeling and cabinet rank**: my inference is lower competition and tighter match between the query and what the site sells, but I could not measure their reviews, links or ages. Section 3 will tell you whether they simply have more of the local signals your two laggards lack.

## 7. Risks and cautions

- Do not publish fake reviews, buy links, or use a fake Boise address. Any of these can lose the GBP or trigger a penalty.
- Pruning pages is intentional. A smaller, stronger set usually outranks a larger, thinner one on a new domain. Reinstate city pages after they have unique proof (local photos, reviews, neighborhood detail).
- Five brands sharing one legal entity is fine, but each needs its own phone, GBP and clear differentiation, and the services must not overlap.
- Confirm the Idaho assumed business name registrations for Boise Handyman Co and Boise Construction Co match what you show publicly.

## 8. Priority checklist (first 14 days)

- [ ] Run the section 3 diagnostics and record baselines.
- [ ] Verify or create GBP for handyman and construction; assign unique phone numbers.
- [ ] Send the first 15 review requests to past customers.
- [ ] Add the word "handyman" to the handyman H1.
- [ ] Noindex the weakest city-by-service pages on both sites.
- [ ] Confirm FAQ text is in the raw HTML on both homepages.
- [ ] Remove or substantiate "Est. 2020" and "100+ projects".
- [ ] Decide commercial vs residential for construction and additions ownership.
- [ ] Replace the copied remodeling files in each repo's `seo-audit/` folder with brand-specific plans.
- [ ] Submit Bing Places, Apple Business Connect, Yelp, BBB, Angi, Thumbtack, Nextdoor.
