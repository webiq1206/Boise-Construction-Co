# Boise Remodeling Co Website

## Overview
The Boise Remodeling Co website is a marketing and lead-generation platform for a Boise, Idaho design-build remodeling company. The site serves homeowners in the Treasure Valley (Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton) considering kitchen remodels, bathroom remodels, whole-home renovations, and room additions. Key features include an instant estimate calculator (project type + finish level + size → animated price range), a consultation request form, a founding-clients offer section, a blog, and a B2B lead distribution marketplace for subcontractors.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: Mobile-first responsive design. Montserrat (`font-sans`) for all headings and body text; the serif (Fraunces, `font-serif`) is reserved exclusively for decorative accents — italic emphasis words via `.brc-accent` and display numerals via `.brc-display-num`. Do not apply `font-serif` to heading elements.
- **Color Palette**: Warm cream background (`36 30% 97%`), warm dark charcoal foreground (`24 18% 12%`), terracotta/sienna primary (`18 56% 40%`), warm sand secondary, soft sage accent.
- **Component Library**: shadcn/ui (Radix UI primitives) with custom Tailwind CSS.
- **Homepage**: 12-section single-page marketing layout: Hero → Trust Strip → Founder Note → Inspiration Gallery → Estimate Calculator → Below-Calculator Cards → How We Build → Principles → Financing/Guarantee → Founding Clients → FAQ Accordion → Consultation Form.
- **Founding Spots**: `FOUNDING_SPOTS_REMAINING` constant in `shared/contentData.ts` — update manually as spots fill.
- **Mobile Navigation**: Sticky bottom bar with "Call" and "Begin a conversation" links. Desktop nav has logo, anchor links, phone with pulsing green dot, and "Book a free visit" CTA.

### Technical Implementations
- **Frontend Framework**: Next.js 14 (App Router) with React 18 and TypeScript.
- **Instant Estimate Calculator**: Client component (`EstimateCalculator.tsx`) — project type cards + finish level cards + size preset → animated price range, typically-included list, ROI, and disclaimer. Saves estimate to sessionStorage for form pre-fill.
- **Consultation Form**: Client component (`ConsultationForm.tsx`) — reads sessionStorage estimate, collects name/phone/email/zip/project/message, posts to `/api/consultation`, sends admin notification + customer confirmation via Gmail.
- **FAQ Section**: Client component (`FAQSection.tsx`) — Radix Accordion with 9 Q&As.
- **Lead Distribution System**: B2B lead marketplace with admin dashboard, subcontractor portal, privacy protection, automated lead pricing, legal agreement flow, and in-app notifications. Integrates with Stripe for payments and supports an account credits system.
- **Blog System**: Infrastructure kept but no posts yet — `shared/blogContent.ts` has empty `BLOG_POSTS` array.
- **Email**: Gmail (Google Workspace) integration via the `google-mail` connector. Sends through `hello@p5homeco.com`, From/Reply-To = `hello@boiseremodeling.co` (verified send-as alias). Transport: `server/services/gmailTransport.ts` (Gmail API, base64url MIME). Resend connector left in place but unused.
- **Service Areas**: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton (Ada + Canyon County).
- **Services**: Kitchen Remodel, Bathroom Remodel, Whole-Home Remodel, Room Addition.

### System Design Choices
- **Backend Framework**: Next.js API routes.
- **Database Schema**: Drizzle ORM for PostgreSQL via Neon serverless driver. Tables: `quotes`, `leads`, `users`, `sessions`, `leadPurchases`, `creditTransactions`, `notifications`, `siteSettings`, `consultationRequests`, `blogPosts`, `galleryPhotos`, `testimonials`.
- **Content Management**: Services and cities centralized in `shared/contentData.ts`. `FOUNDING_SPOTS_REMAINING` constant also lives there.
- **Build System**: Next.js with TypeScript.

## External Dependencies
- **Radix UI**: Headless accessible components (via shadcn/ui).
- **react-hook-form** + **@hookform/resolvers**: Form state and Zod validation.
- **@tanstack/react-query**: Server state management.
- **Tailwind CSS**: Utility-first CSS framework.
- **zod**: Schema validation.
- **@neondatabase/serverless** + **drizzle-orm**: Database ORM.
- **date-fns**: Date manipulation.
- **nanoid**: Unique ID generation.
- **Gmail (Google Workspace)**: Transactional email via the `google-mail` connector / Gmail API. Resend connector remains configured but unused.
- **Stripe**: Payments for the lead marketplace.
- **Playfair Display** + **Montserrat**: Google Fonts (loaded via `next/font/google`).
