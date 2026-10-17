# Site-wide Infrastructure Audit

## app/layout.tsx
| Field | Value | Status |
|---|---|---|
| Default title | `Boise Remodeling Co - Professional Design-Build Remodeling in Kuna, Idaho` | PASS (62 chars, within Google SERP truncation tolerance) |
| Title template | `%s | Boise Remodeling Co` | PASS |
| Default description | "Professional remodeling, landscaping & Christmas light installation services..." | PASS (under 160) |
| metadataBase | `https://boiseremodeling.co` | PASS |
| Default canonical | `/` set per page | PASS |
| Robots | `index: true, follow: true` with full Googlebot directives | PASS |
| OG default | type=website, locale=en_US, siteName set, 1200x630 image declared | PASS |
| Twitter default | summary_large_image | PASS |
| Verification | google: placeholder | LOGGED (replace when GSC verifies) |
| LCP image preload | `/images/hero-background.webp` with fetchPriority=high | PASS |
| Theme color | `#1E5128` via viewport export | PASS (added) |
| Manifest | `/site.webmanifest` | PASS (added) |
| GA4 | G-1HD7RT8PKJ injected via next/script afterInteractive | PASS |
| Duplicate JSON-LD | Removed hardcoded LocalBusiness | FIXED |

## app/sitemap.ts
| Check | Result |
|---|---|
| Returns MetadataRoute.Sitemap | PASS |
| Includes homepage + 6 areas + 28 services + 168 city-services + 92 blog + 12 utility | PASS (294 entries) |
| Sets priority 1.0 (home), 0.9 (areas), 0.8 (services), 0.7 (city-services), 0.6 (blog), 0.5 (utility) | PASS |
| Sets changeFrequency=daily for home, weekly for blog, monthly for static | PASS |
| Excludes /admin, /subcontractor, /api, /quote, /quote-status | PASS |

## app/robots.ts
| Check | Result |
|---|---|
| Allow: * | PASS |
| Disallow: /api/, /admin/, /subcontractor | PASS |
| Sitemap URL emitted | PASS |
| Host emitted | PASS |

## app/not-found.tsx
| Field | Value | Status |
|---|---|---|
| Metadata title | "Page Not Found (404)" | FIXED (was absent) |
| Description | NAP + service CTA | FIXED |
| Robots | `index:false, follow:true` | FIXED |
| Custom UI | search + CTAs to /services and /get-quote | PASS |

## public/llms.txt
| Check | Result |
|---|---|
| Lists site purpose, NAP, primary services and pages | PASS |
| 69 lines, ASCII clean | PASS |

## public/site.webmanifest
| Check | Result |
|---|---|
| name, short_name, start_url, display=standalone | PASS (added) |
| theme_color #1E5128, background_color #FFFFFF | PASS |
| icons reference existing icon-192.png + icon-512.png | PASS |
