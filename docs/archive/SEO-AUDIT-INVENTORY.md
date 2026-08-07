# SEO Audit Inventory - Boise Remodeling Co

**Last updated:** 2026-05-30 — topical authority ecosystem finalized.

## Content surface (published)

| Asset | Count | Source |
|---|---|---|
| Hub pillar + location guides | 23 | `shared/guideContent.ts`, `shared/content/allHubsContent.ts` |
| Blog cluster articles | 75 | `shared/content/allBlogPosts.ts` |
| Content manifest entries | 94 | `shared/contentHubs.ts` (all `published`) |
| Blog category hub pages | 10 | `app/blog/category/[hubSlug]/page.tsx` |
| Static sitemap URLs (approx.) | ~203 | `npm run build` — home, services, areas, guides, blog, categories |

## Group A - Root / Site-wide

| Route | File | Notes |
|---|---|---|
| Layout | `app/layout.tsx` | Title template, root OG, GA4, JSON-LD |
| `/sitemap.xml` | `app/sitemap.ts` | Services, areas, guides, blog, category hubs |
| `/robots.txt` | `app/robots.ts` | Disallows /api, /admin, /subcontractor |
| `/404` | `app/not-found.tsx` | Custom not-found |
| `/llms.txt` | `public/llms.txt` | AI crawler manifest — guides + category hubs |

## Group B - Homepage

| Route | File | Schema |
|---|---|---|
| `/` | `app/page.tsx` | LocalBusiness, Organization, FAQPage, Speakable |

## Group C - Service Pages (5 services)

Template: `app/services/[slug]/page.tsx`  
Services: kitchen-remodel, bathroom-remodel, whole-home-remodel, room-addition, adu

## Group D - City-Service Pages (5 × 8 cities = 40)

Template: `app/services/[slug]/[city]/page.tsx`  
Cities: boise, meridian, eagle, nampa, kuna, star, middleton, caldwell

## Group E - Area Pages (8 routes)

Template: `app/areas/[slug]/page.tsx`

## Group F - Guides (23 + index)

| Route | Template | Schema |
|---|---|---|
| `/guides` | `app/guides/page.tsx` | WebPage, BreadcrumbList |
| `/guides/[slug]` | `app/guides/[slug]/page.tsx` | Article, FAQ, Breadcrumb, Speakable |

## Group G - Blog (75 posts + index + 10 category hubs)

| Route | Template | Schema |
|---|---|---|
| `/blog` | `app/blog/page.tsx` | WebPage, BreadcrumbList |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Article, FAQ, Breadcrumb, Speakable |
| `/blog/category/[hubSlug]` | `app/blog/category/[hubSlug]/page.tsx` | CollectionPage, BreadcrumbList |

## Group H - Static utility

`/about`, `/contact`, `/testimonials`, `/areas`, `/privacy-policy`, `/terms-of-service`

## Quality gates

- `npm run verify:content` — pillar ≥4k words, cluster ≥2.5k, FAQ/city coverage
- `npm run links:generate` — internal link graph (~147 pages, ~1k links)
- `prebuild` runs links + audit + verify before `next build`

## Redirects (content migration)

- `/blog/kitchen-remodel-cost-treasure-valley` → `/blog/kitchen-remodel-cost-boise`
- `/blog/bathroom-remodel-cost-idaho` → `/blog/bathroom-remodel-cost-boise`
