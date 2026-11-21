import type { ServiceData, CityData } from './contentData';
import { cityServiceBudgetQuestion, cityServiceCostQuestion, getCountyLabel, SERVICE_AREA_LINE, serviceLabel } from './contentData';
import { getAreaCityCopy } from './content/areaCopy';
import { getCityServiceCopy } from './content/cityServiceCopy';
import { indianCreekDescription } from '../lib/seo';
import {permitGuidance,permitSource} from '../lib/permitGuidance';
import type { LandingSection } from '@/components/seo/LandingPageTemplate';

export interface FAQItem {
  question: string;
  answer: string;
  /** Visible inline anchors. Schema and the answer string stay plain text. */
  links?: { phrase: string; href: string }[];
}

/** Minimal shape of a CITY_SEO_DATA entry needed to build local sections. */
export interface CitySeoFacts {
  neighborhoods: string[];
  landmarks: string[];
  climate: string;
  population?: string;
}

export interface ServiceSEOContent {
  slug: string;
  name: string;
  headline: string;
  primaryKeyword: string;
  overview: string;
  /**
   * Hero support line when the overview's first sentence runs past the hero
   * budget (LandingPageTemplate splitHeroLead). The full overview still renders
   * directly below the hero.
   */
  heroLine?: string;
  benefits: string[];
  inclusions: string[];
  timeline: string;
  processSteps: { title: string; description: string }[];
  faqs: FAQItem[];
  /**
   * Server-rendered cost planning copy. The estimator's price bands are
   * client-side JS and invisible to crawlers and AI engines; this section puts
   * the same planning ranges in static HTML (local-seo-audit/10-aeo-geo-plan.md
   * Fix A). Ranges must stay consistent with the estimator and pillar guides.
   */
  costGuidance?: { heading: string; paragraphs: string[] };
}

/**
 * Every price figure below for a new home comes from the P5 instant estimator
 * (owner, 21 November 2026), for the inputs the sentence states, and is pinned
 * to shared/content/p5PublishedFigures.json by tests/p5-published-figures.test.ts.
 * The estimator has no shop home project, so shop home copy quotes its new
 * home and detached garage or shop ranges separately and never adds them
 * together. Work no engine prices (site work, wells and septic, lot
 * evaluations) carries no figure.
 */
export const SERVICE_SEO_CONTENT: Record<string, ServiceSEOContent> = {
  'custom-home-builder': {
    slug: 'custom-home-builder',
    name: 'Custom Home Building',
    headline: 'Custom home builder in the Treasure Valley',
    primaryKeyword: 'custom home builder boise idaho',
    overview:
      'A custom home starts from a blank page rather than a catalog. Boise Construction Co handles feasibility, design, engineering, permitting, and construction as one accountable company, so the drawings, the budget, and the schedule stay tied together from the first sketch to the day you get the keys.',
    benefits: [
      'One accountable company and one point of contact from feasibility through final walkthrough',
      'Line-item budget you can see, not a single lump-sum number',
      'Allowance amounts set from real local pricing, not placeholder figures',
      'Written weekly schedule and cost updates for the life of the build',
    ],
    inclusions: [
      'Site and soils review before design begins',
      'Architectural design, structural engineering, and permit-ready drawings',
      'Ada or Canyon County plan review, permits, and impact fees',
      'Full construction with a dedicated project manager on your build',
      'Blower-door test, final inspections, and a written workmanship warranty',
    ],
    timeline:
      'Plan on 10 to 16 months end to end: roughly 2 to 4 months for design and selections, 1 to 3 months for permitting, then 7 to 11 months of construction depending on size and site complexity.',
    processSteps: [
      {
        title: 'Planning consultation',
        description: 'We talk through your lot, your program, and a realistic budget band before anyone draws anything.',
      },
      {
        title: 'Feasibility and site review',
        description: 'Soils, utilities, access, setbacks, and slope get checked so the design suits the ground it sits on.',
      },
      {
        title: 'Design and line-item budget',
        description: 'Drawings, selections, and a line-item budget with written allowances are locked together before we submit for permit.',
      },
      {
        title: 'Build and handover',
        description: 'Weekly updates through construction, then testing, walkthrough, and your warranty documents.',
      },
    ],
    faqs: [
      {
        question: 'How much does it cost to build a custom home in Boise?',
        answer:
          'Our instant estimate gives a 2,400 square foot home with an attached 2-car garage a preliminary range of $502,860 to $829,330 at Essential finish and $688,660 to $1,135,770 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. That is $209 to $474 per square foot of living space at Essential to Signature finish. Site work beyond a typical lot and utility connection fees are not yet determined in that range, and foothills lots and highly detailed designs run above it.',
      },
      {
        question: 'How long does it take to build a custom home in the Treasure Valley?',
        answer:
          'Budget 10 to 16 months from the start of design to move-in. Design and selections take 2 to 4 months, permitting takes 1 to 3 months, and construction runs 7 to 11 months. Plan review timelines in Ada and Canyon County are the most common source of delay.',
      },
      {
        question: 'Do I need to own land before I contact a builder?',
        answer:
          'No, and it is often better if you have not bought yet. We review candidate lots for soils, utilities, access, and setback constraints before you commit, because the parcel drives a large share of the final budget.',
      },
      {
        question: 'What is not included in a per-square-foot price?',
        answer:
          'Our per-square-foot figures are planning ranges for the house itself, excluding land. Site work, impact fees and utility connections are estimated separately for your lot, and well and septic on rural parcels, landscaping, fencing, and window coverings sit outside that number too. We itemize each one so nothing surfaces late.',
      },
      {
        question: 'How do you handle budget changes during construction?',
        answer:
          'Every change is priced and approved in writing before the work happens. You see the running cost against the original line-item budget in your weekly update, so there is no reconciliation surprise at the end.',
      },
      {
        question: 'Do you build on rural acreage outside city limits?',
        answer:
          'Rural parcels without municipal service may need a well, a septic system, and private road or power extensions. Confirm utility availability for the parcel first. Septic review goes through Central District Health in Ada County or Southwest District Health in Canyon County. That site work can cost more than the foundation and framing, and the instant estimate does not price it, so we price it for the parcel during feasibility.',
      },
      {
        question: 'Can I supply my own plans?',
        answer:
          'Yes. We will review them for constructability, code compliance, and cost, then tell you plainly where the drawings and your budget disagree before we contract to build.',
      },
    ],
    costGuidance: {
      heading: 'Custom home building cost in the Treasure Valley',
      paragraphs: [
        'Our instant estimate gives a 2,400 square foot home with an attached 2-car garage a preliminary range of $502,860 to $829,330 at Essential finish and $688,660 to $1,135,770 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. That is $209 to $474 per square foot of living space at Essential to Signature finish. The estimate also includes the city impact fees and road impact fee a new home pays. It does not include surveys and soils reports, unusual site conditions such as rock, high groundwater or long utility runs, or landscaping, fencing and window coverings, and utility connection and capacity fees are not yet determined. Foothills sites, steep grades and highly detailed interiors run above it.',
        'These are preliminary ranges, not bids. Lot conditions, home size, roof and wall complexity, and finish level drive the final number, which we confirm with a line-item budget after a lot walkthrough.',
      ],
    },
  },

  'semi-custom-homes': {
    slug: 'semi-custom-homes',
    name: 'Semi-Custom Homes',
    headline: 'Semi-custom home building in the Treasure Valley',
    primaryKeyword: 'semi custom home builder boise idaho',
    overview:
      'A semi-custom home starts from a floor plan that has already been drawn, engineered, and built, then adapts it to your lot and your selections. You give up some layout freedom and get back a shorter timeline, a narrower budget range, and far fewer decisions.',
    benefits: [
      'Proven plans with known costs, so the budget band is tighter from day one',
      'Two to four months shorter than an equivalent fully custom build',
      'Structural engineering already complete on the base plan',
      'Curated finish packages that keep selections from stalling the schedule',
    ],
    inclusions: [
      'Plan selection and adaptation to your lot and orientation',
      'Structural updates required by your site and snow or wind loads',
      'Permit-ready drawing set and county submission',
      'Finish package selection with fixed allowance amounts',
      'Full construction, final inspections, and written workmanship warranty',
    ],
    timeline:
      'Most semi-custom homes run 7 to 10 months total: 6 to 10 weeks for plan adaptation and permitting, then 6 to 8 months of construction.',
    processSteps: [
      {
        title: 'Plan and lot match',
        description: 'We walk your lot and identify which base plans actually fit the setbacks, slope, and views.',
      },
      {
        title: 'Adaptation and pricing',
        description: 'Structural and layout changes are drawn and priced against a fixed base, so you see what each change costs.',
      },
      {
        title: 'Selections',
        description: 'You choose from finish packages with real allowance figures rather than open-ended placeholders.',
      },
      {
        title: 'Build and handover',
        description: 'Construction on a published schedule, then inspections, walkthrough, and warranty documents.',
      },
    ],
    faqs: [
      {
        question: 'How much does a semi-custom home cost in the Treasure Valley?',
        answer:
          'Our instant estimate has no separate semi-custom price: it gives a 2,000 square foot home with an attached 2-car garage a preliminary range of $428,840 to $707,290 at Essential finish and $584,860 to $964,580 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. If you bring complete design and engineered plans, the estimate leaves design and engineering out.',
      },
      {
        question: 'What is the difference between semi-custom and fully custom?',
        answer:
          'Semi-custom starts from an existing engineered plan and modifies it. Fully custom starts from a blank page. Semi-custom is faster and the budget band is narrower; fully custom gives you complete control over layout and massing.',
      },
      {
        question: 'How much can I change a semi-custom plan?',
        answer:
          'Finishes, cabinetry, elevations, and non-structural walls are straightforward. Moving load-bearing walls, changing the roof structure, or altering the foundation footprint triggers re-engineering, and at that point a custom design is often the better value.',
      },
      {
        question: 'Is a semi-custom home lower quality than a custom home?',
        answer:
          'No. The framing, envelope, mechanical systems, and workmanship standards are identical. The difference is how much of the design work has already been done.',
      },
      {
        question: 'Can a semi-custom plan work on a sloped or irregular lot?',
        answer:
          'Sometimes, with a daylight basement or a revised foundation. We check this during the lot match step, because forcing an unsuitable plan onto a difficult site erases the cost advantage that made it appealing.',
      },
      {
        question: 'How long does a semi-custom home take to build?',
        answer:
          'Typically 7 to 10 months from contract to move-in, compared with 10 to 14 months for a fully custom home of similar size.',
      },
    ],
    costGuidance: {
      heading: 'Semi-custom home cost in the Treasure Valley',
      paragraphs: [
        'Our instant estimate has no separate semi-custom price: it gives a 2,000 square foot home with an attached 2-car garage a preliminary range of $428,840 to $707,290 at Essential finish and $584,860 to $964,580 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. That is $214 to $483 per square foot of living space. Site work beyond a typical lot and utility connection fees are not yet determined in that range. The savings against a fully custom build come from design and engineering work that is already complete, not from cheaper construction.',
        'These are preliminary ranges, not bids. Lot conditions, plan modifications, and finish level move the number, which we confirm with a line-item budget once a plan and lot are matched.',
      ],
    },
  },

  'build-on-your-lot': {
    slug: 'build-on-your-lot',
    name: 'Build on Your Lot',
    headline: 'Build on your lot in the Treasure Valley',
    primaryKeyword: 'build on your lot boise idaho',
    overview:
      'You already own the land, whether it is family acreage, an infill parcel, or a lot in a master-planned community. Boise Construction Co takes it from there: feasibility, design that suits the ground, permits, and construction, with the site constraints priced before you commit to a plan.',
    benefits: [
      'Site constraints identified and priced before design money is spent',
      'Design shaped around your existing parcel, views, and orientation',
      'Well, septic, and utility extension scoped up front on rural land',
      'HOA and architectural committee submissions handled for you',
    ],
    inclusions: [
      'Soils, utility, access, and setback review on your parcel',
      'Site plan, grading, and drainage design',
      'Architectural design and permit-ready drawings',
      'County or city permits, impact fees, and HOA design approval',
      'Full construction with a dedicated project manager',
    ],
    timeline:
      'Plan on 9 to 13 months end to end. Serviced lots inside city limits move fastest; rural parcels needing a well, septic approval, or power extension add 6 to 12 weeks before construction can start.',
    processSteps: [
      {
        title: 'Lot walkthrough',
        description: 'We walk the parcel with you and flag what will drive cost: slope, soils, access, and utility distance.',
      },
      {
        title: 'Feasibility report',
        description: 'You get a written summary of site work, utility, and permitting costs before committing to a design.',
      },
      {
        title: 'Design and permits',
        description: 'Drawings tuned to the lot, then submission to the county, city, and any HOA committee.',
      },
      {
        title: 'Build and handover',
        description: 'Construction on a published schedule, then inspections, walkthrough, and warranty documents.',
      },
    ],
    faqs: [
      {
        question: 'What does it cost to build on land I already own?',
        answer:
          'Our instant estimate gives a 2,400 square foot home with an attached 2-car garage a preliminary range of $502,860 to $829,330 at Essential finish and $688,660 to $1,135,770 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. Site work is separate and varies enormously: a serviced lot in a Meridian subdivision needs far less than rural acreage that requires a well, septic, and access. The instant estimate lists site work beyond a typical lot as not yet determined, so we price it for your parcel.',
      },
      {
        question: 'How do I know if my lot is actually buildable?',
        answer:
          'Buildability comes down to soils, utility access, legal access, setbacks, slope, and floodplain status. We review all six before design begins, and we will tell you if a parcel is not worth building on.',
      },
      {
        question: 'Do I need a well and septic on rural Ada or Canyon County land?',
        answer:
          'Confirm municipal connection options before assuming a well or septic system is needed. For septic review, contact Central District Health in Ada County or Southwest District Health in Canyon County. Well requirements are handled through the Idaho Department of Water Resources. The instant estimate does not price a well or septic system, so we price them for the parcel, where site conditions and well depth set the cost.',
      },
      {
        question: 'Can you build in a subdivision with an HOA?',
        answer:
          'Yes. Master-planned communities in Meridian, Eagle, Star, and Kuna typically have architectural committees governing elevations, materials, and colors. We prepare and submit those packages as part of the design phase.',
      },
      {
        question: 'What if my lot has a slope?',
        answer:
          'Slope is not a problem, it is a design input. A daylight basement can turn grade change into usable square footage at a lower cost per foot than above-grade space. Steep sites do require engineered foundations and retaining, which we price during feasibility.',
      },
      {
        question: 'Can you help before I buy the land?',
        answer:
          'Yes, and that is the better sequence. Our lot evaluation service reviews a parcel before purchase so you are not discovering an expensive access problem after closing.',
      },
    ],
    costGuidance: {
      heading: 'Build on your lot cost in the Treasure Valley',
      paragraphs: [
        'Our instant estimate gives a 2,400 square foot home with an attached 2-car garage a preliminary range of $502,860 to $829,330 at Essential finish and $688,660 to $1,135,770 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. The estimate assumes a buildable lot you already own with utilities at the street, so site work beyond a typical lot is not yet determined in it. Serviced lots inside city limits commonly need modest site work, while rural parcels requiring a well, septic system, and access improvements need far more before the foundation is poured.',
        'These are preliminary ranges, not bids. Because the parcel drives so much of the number, we produce a written feasibility summary for your specific lot before design begins.',
      ],
    },
  },

  'design-build': {
    slug: 'design-build',
    name: 'Design-Build',
    headline: 'Design-build home construction in the Treasure Valley',
    primaryKeyword: 'design build home builder boise idaho',
    overview:
      'Design-build puts the drawings and the construction with one accountable company. Instead of hiring an architect, bidding the finished plans, and discovering the design costs 40 percent more than you budgeted, the design is priced continuously as it develops.',
    benefits: [
      'Design priced as it develops, so the drawings never outrun the budget',
      'One accountable company and one point of contact instead of two',
      'No re-drawing cycle after bids come back over budget',
      'Constructability reviewed by the people who will actually build it',
    ],
    inclusions: [
      'Programming and budget alignment before design begins',
      'Architectural design with continuous cost feedback',
      'Structural, mechanical, and energy compliance engineering',
      'Permit submission and plan review management',
      'Construction, inspections, and written workmanship warranty',
    ],
    timeline:
      'Design-build projects generally run 10 to 14 months end to end. The design phase overlaps with permitting and long-lead ordering, which typically saves 4 to 8 weeks against a design-bid-build sequence.',
    processSteps: [
      {
        title: 'Programming and budget',
        description: 'We agree on the target budget and what the home has to do before a single line is drawn.',
      },
      {
        title: 'Schematic design with live pricing',
        description: 'Each design iteration comes back with a cost, so trade-offs are made with real numbers in hand.',
      },
      {
        title: 'Documentation and permits',
        description: 'Construction documents, engineering, and county submission, with long-lead items ordered in parallel.',
      },
      {
        title: 'Build and handover',
        description: 'Construction by the team that priced the design, then testing, walkthrough, and warranty.',
      },
    ],
    faqs: [
      {
        question: 'What does design-build mean for a new home?',
        answer:
          'Design and construction sit with one accountable company and one point of contact for your project. You have a single point of accountability, and the design is priced continuously rather than bid once it is finished.',
      },
      {
        question: 'Is design-build cheaper than hiring an architect separately?',
        answer:
          'Not automatically, but it removes the most expensive failure mode in home building: a completed design that comes in far over budget and has to be re-drawn. Continuous pricing catches that at the sketch stage instead of after construction documents.',
      },
      {
        question: 'Do I lose design quality by not hiring an architect directly?',
        answer:
          'No. Design-build teams include licensed design professionals. What changes is who holds the contract and whether cost feedback arrives during design or after it.',
      },
      {
        question: 'Can I bring my own architect into a design-build contract?',
        answer:
          'Yes. We work alongside an owner-selected architect regularly, providing pricing during design so the drawings stay inside your budget.',
      },
      {
        question: 'How much does the design phase cost?',
        answer:
          'In our instant estimate, design drawings, structural engineering and energy code calculations add a preliminary $8,800 to $19,330 to the range for a 2,400 square foot home with an attached 2-car garage at Essential to Signature finish, compared with bringing complete plans (November 2026). Our construction contracts include design, engineering and permits.',
      },
      {
        question: 'What happens if the design comes in over budget anyway?',
        answer:
          'With live pricing it rarely gets far off, but when it does we present specific trade-offs with costs attached rather than asking you to cut blindly.',
      },
    ],
    costGuidance: {
      heading: 'Design-build cost in the Treasure Valley',
      paragraphs: [
        'Our instant estimate gives a 2,400 square foot home with an attached 2-car garage a preliminary range of $502,860 to $829,330 at Essential finish and $688,660 to $1,135,770 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. Design drawings, structural engineering and energy code calculations account for $8,800 to $19,330 of that, the difference from the same home with complete plans. The design scope and price are agreed in writing before design work starts.',
        'These are preliminary ranges, not bids. The advantage of design-build is that your number gets more precise at every design milestone instead of arriving all at once when drawings go out to bid.',
      ],
    },
  },

  'home-plans-design': {
    slug: 'home-plans-design',
    name: 'Home Design & Plans',
    headline: 'Custom home design and plans in the Treasure Valley',
    primaryKeyword: 'custom home plans boise idaho',
    overview:
      'Permit-ready drawings for a home designed around your actual lot. We produce architectural design, structural engineering, and the energy compliance documentation Ada and Canyon County require, whether or not you ultimately build with us.',
    benefits: [
      'Drawings designed for your specific lot, orientation, and views',
      'Structural engineering and energy compliance included in the set',
      'Costed as it is drawn, so the design matches your budget',
      'Plans you own outright and can build with any licensed contractor',
    ],
    inclusions: [
      'Programming session and site measurement',
      'Schematic floor plans and exterior elevations',
      'Construction documents and building sections',
      'Structural engineering and Idaho energy code compliance',
      'Permit submission support for Ada or Canyon County',
    ],
    timeline:
      'A complete permit-ready set typically takes 8 to 16 weeks depending on home size and how quickly design decisions are made. County plan review adds a further 3 to 8 weeks.',
    processSteps: [
      {
        title: 'Programming',
        description: 'We document how you want to live in the home and what the budget will actually support.',
      },
      {
        title: 'Schematic design',
        description: 'Floor plans and elevations, revised with cost feedback at each round.',
      },
      {
        title: 'Construction documents',
        description: 'Full drawing set with structural engineering and energy compliance calculations.',
      },
      {
        title: 'Permit submission',
        description: 'We submit to the county or city and manage plan review comments through approval.',
      },
    ],
    faqs: [
      {
        question: 'How much do custom home plans cost in Idaho?',
        answer:
          'In our instant estimate, design drawings, structural engineering and energy code calculations add a preliminary $8,800 to $19,330 to the range for a 2,400 square foot home with an attached 2-car garage at Essential to Signature finish, compared with bringing complete plans (November 2026). Small or simple homes cost less to design; large or architecturally complex homes cost more, and we price a design-only engagement after a programming session.',
      },
      {
        question: 'Do I own the plans when they are finished?',
        answer:
          'Yes. You own the drawings and can build them with any licensed contractor. We would like to be that contractor, but the plans are yours either way.',
      },
      {
        question: 'Can I buy a stock plan online instead?',
        answer:
          'You can, but stock plans are not drawn for your lot and almost always need Idaho-specific structural engineering, energy compliance, and a site-adapted foundation before a county will permit them. Factor that rework into the comparison.',
      },
      {
        question: 'What does a permit-ready set actually include?',
        answer:
          'Floor plans, exterior elevations, building sections, foundation and framing plans, electrical and mechanical layouts, structural engineering, and Idaho energy code compliance documentation.',
      },
      {
        question: 'How long does county plan review take?',
        answer:
          'Ada County and City of Boise residential review commonly runs 3 to 6 weeks; Canyon County jurisdictions are often similar. Revision cycles add time, which is why a complete first submission matters.',
      },
      {
        question: 'Can you design for a lot I have not purchased yet?',
        answer:
          'We recommend completing a lot evaluation first. Setbacks, slope, soils, and utility locations all shape the design, and drawing before those are known usually means drawing twice.',
      },
    ],
    costGuidance: {
      heading: 'Home design and plan cost in the Treasure Valley',
      paragraphs: [
        'In our instant estimate, design drawings, structural engineering and energy code calculations add a preliminary $8,800 to $19,330 to the range for a 2,400 square foot home with an attached 2-car garage at Essential to Signature finish, compared with bringing complete plans (November 2026). Simple single-level homes cost less to design and large or complex designs more.',
        'These are preliminary figures, not bids. Home size, structural complexity, and the number of design revision rounds drive the final figure, which we fix in writing after a programming session.',
      ],
    },
  },

  adu: {
    slug: 'adu',
    name: 'ADUs & Guest Houses',
    headline: 'Detached ADU builder in Boise, Idaho',
    primaryKeyword: 'detached adu builder boise idaho',
    heroLine: 'New detached ADUs and guest houses, built as separate structures on the lot you already own.',
    overview:
      'Detached ADU builder in Boise, Idaho: Boise Construction Co plans and builds new accessory dwellings and guest houses as separate structures on the lot you already own, from feasibility and design through permits and construction.',
    benefits: [
      'Feasibility before design, so setbacks and utilities shape the plan',
      'One accountable team from drawings through the final walkthrough',
      'Line-item budget with written allowances before construction',
      'Boise ADU Co projects currently run through Boise Construction Co',
    ],
    inclusions: [
      'Property and setback review for an accessory dwelling',
      'Layout planning for family, guests, or independent living',
      'Permit-ready drawings and local permit coordination',
      'Utility connection planning called out as separate lines',
      'Construction, inspections, and a written workmanship warranty',
    ],
    timeline:
      'Timeline depends on the unit size, utility extensions, site work, and plan review. Many detached ADUs land inside a shorter window than a full custom home; we set a project-specific schedule after the site review.',
    processSteps: [
      {
        title: 'Talk about the property',
        description: 'Share the address, intended use, and what you know about access, utilities, and the existing home.',
      },
      {
        title: 'Review feasibility',
        description: 'Confirm setbacks, utilities, parking, and jurisdiction rules before anyone draws a floor plan.',
      },
      {
        title: 'Design and budget',
        description: 'Develop the layout, selections, and a line-item budget with written allowances.',
      },
      {
        title: 'Permits and build',
        description: 'Coordinate approvals and construction, with written progress updates through handover.',
      },
    ],
    faqs: [
      {
        question: 'Who builds ADUs in Boise?',
        answer:
          'Boise Construction Co builds new detached ADUs and guest houses across the Treasure Valley. Garage and basement conversions are remodeling work, handled by Boise Remodeling Co.',
      },
      {
        question: 'Can every lot have an ADU?',
        answer:
          'No. Feasibility depends on setbacks, lot coverage, utilities, access, and local rules. A site review answers those questions before design starts.',
      },
      {
        question: 'How much does an ADU cost in the Treasure Valley?',
        answer:
          'Cost depends on size, utility extensions, site work, and finishes. We price after a site review rather than quoting a square-foot number without seeing the lot. Request a quote and we answer your questions and help you work out the next step.',
        links: [{ phrase: 'Request a quote', href: '/estimate' }],
      },
      {
        question: 'Do ADUs need permits in Boise and Ada County?',
        answer:
          'Yes. Most accessory dwellings need plans and a building permit, and some parcels need separate utility or driveway approvals. We coordinate the local path as part of the project.',
      },
      {
        question: 'How do I start an ADU project?',
        answer:
          'Request a quote with your address and intended use. We review what the property allows, then outline design, permits, and a planning budget before construction.',
        links: [{ phrase: 'Request a quote', href: '/estimate' }],
      },
    ],
    costGuidance: {
      heading: 'Planning an ADU in the Treasure Valley',
      paragraphs: [
        'A detached ADU is priced from the property up: setbacks, utilities, access, and site work shape the scope more than a generic square-foot figure.',
        'Request a quote and we answer your questions and help you work out the next step. A site review comes before a detailed proposal, so the first number you see is grounded in your lot.',
      ],
    },
  },

  'home-additions': {
    slug: 'home-additions',
    name: 'Home Additions',
    headline: 'Structural home additions in the Treasure Valley',
    primaryKeyword: 'structural home additions boise idaho',
    overview:
      'Structural home additions in the Treasure Valley add new footprint or a second story to the house you already live in. Boise Construction Co plans each one around the home already standing, from the first look at structure and utilities through permits, construction, and the final walkthrough.',
    benefits: [
      'Make room for the way your household lives now',
      'Plan the addition around the existing home before construction begins',
      'Coordinate design, permits, and construction with one team',
      'Keep decisions clear while work is happening at the home you live in',
    ],
    inclusions: [
      'In-home planning conversation and existing-home review',
      'Design and structural coordination for the new connection',
      'Permit-ready drawings and local permit coordination',
      'Construction planning around access, utilities, and the occupied home',
      'Final inspections and walkthrough',
    ],
    timeline:
      'The right schedule depends on the addition, the existing structure, permit review, and the work needed to connect new space to the home. We review those details with you before setting a construction plan.',
    processSteps: [
      {
        title: 'Start at your home',
        description: 'We meet at the house to understand what is not working, what space you need, and how the new room should connect to daily life.',
      },
      {
        title: 'Review the existing conditions',
        description: 'The current structure, utilities, access, and the likely connection point guide the plan before the scope is finalized.',
      },
      {
        title: 'Design and permits',
        description: 'We coordinate drawings and the local permit path so the addition is planned for the home it will join.',
      },
      {
        title: 'Build with a clear plan',
        description: 'Construction is sequenced around the work site and your household, followed by inspections and a final walkthrough.',
      },
    ],
    faqs: [
      {
        question: 'What kinds of home additions do you plan?',
        answer:
          'Structural additions that add new footprint or a second story: a bedroom, a larger living area, a suite, or flexible space for changing household needs. The first step is seeing how the new space can connect to the existing home. Remodeling rooms inside the existing footprint is Boise Remodeling Co work.',
      },
      {
        question: 'Can you add onto the home I already live in?',
        answer:
          'That is the purpose of this service. We start with an in-home conversation and review the existing structure, utilities, access, and the area where the addition may connect.',
      },
      {
        question: 'Do home additions need permits in the Treasure Valley?',
        answer:
          'Most additions require plans and permit review. The exact path depends on the property and jurisdiction, so we coordinate the local requirements as the project is planned.',
      },
      {
        question: 'How do I start planning a room addition?',
        answer:
          'Begin with a conversation at your home. Bring the problems you want the new space to solve, any photos or sketches you have, and questions about how construction may affect the household.',
      },
      {
        question: 'Will the addition look connected to the rest of my home?',
        answer:
          'The connection between existing and new construction is a core design question. We work through the roofline, exterior materials, openings, and interior flow while the addition is being planned.',
      },
    ],
    costGuidance: {
      heading: 'Planning a home addition in the Treasure Valley',
      paragraphs: [
        'An addition is not priced like a blank-site home. The existing structure, the connection point, utilities, access, and the room you need all shape the scope. An in-home review is the right place to start a useful budget conversation.',
        'We do not promise a fixed price before reviewing the existing home. The first planning conversation helps identify the work that needs to be understood before a detailed estimate is prepared.',
      ],
    },
  },

  'lot-evaluation': {
    slug: 'lot-evaluation',
    name: 'Lot Evaluation & Feasibility',
    headline: 'Lot evaluation and site feasibility in the Treasure Valley',
    primaryKeyword: 'lot evaluation boise idaho',
    overview:
      'Before you buy a parcel, find out what it will cost to build on it. We review soils, utilities, legal access, setbacks, slope, and floodplain status, then give you a written summary of the site work and permitting costs the lot will carry.',
    benefits: [
      'Site costs known before you close, not after',
      'Written feasibility summary you can take to a lender or seller',
      'Comparison across multiple candidate parcels',
      'Credited toward design if you build with us',
    ],
    inclusions: [
      'Soils and drainage review, including expansive soil risk',
      'Utility locations and connection or extension cost estimate',
      'Legal access, easement, and right-of-way check',
      'Zoning, setback, and floodplain confirmation',
      'Written site work and permitting cost summary',
    ],
    timeline:
      'A standard lot evaluation typically takes 2 to 4 weeks. Parcels needing a formal geotechnical report or septic feasibility review by the health district serving the parcel may take longer. Confirm current review availability before relying on a schedule.',
    processSteps: [
      {
        title: 'Parcel research',
        description: 'We pull zoning, plat, easement, and floodplain records before setting foot on the property.',
      },
      {
        title: 'Site walkthrough',
        description: 'On-site review of slope, drainage, access, vegetation, and utility proximity.',
      },
      {
        title: 'Cost summary',
        description: 'A written estimate of site work, utilities, and permitting specific to that parcel.',
      },
      {
        title: 'Go or no-go',
        description: 'A plain recommendation, including telling you when a lot is not worth what it will cost to build on.',
      },
    ],
    faqs: [
      {
        question: 'How much does a lot evaluation cost?',
        answer:
          'We price a lot evaluation for the parcel, and the fee depends on parcel size and whether a geotechnical report or septic feasibility test is needed. The fee is credited toward design if you go on to build with us.',
      },
      {
        question: 'What makes a lot expensive to build on?',
        answer:
          'Distance to utilities, expansive or unstable soils, steep slope requiring engineered foundations and retaining, lack of legal access, floodplain status, and the need for a well or septic system. Any one of these can add tens of thousands before construction starts.',
      },
      {
        question: 'Can I get a lot evaluated before I make an offer?',
        answer:
          'Yes, and that is the point. Many buyers schedule an evaluation during the inspection contingency period so they can renegotiate or walk if the site work costs are worse than expected.',
      },
      {
        question: 'Do you evaluate rural acreage in Canyon County?',
        answer:
          'Yes. Rural parcels are where evaluations matter most, because well depth, septic suitability, power extension distance, and private road requirements vary enormously between neighboring properties.',
      },
      {
        question: 'What is expansive soil and why does it matter in the Treasure Valley?',
        answer:
          'Expansive clay soils swell when wet and shrink when dry, which moves foundations. Parts of the valley carry this risk, and it is addressed with over-excavation, engineered fill, or a deeper foundation design. It is far cheaper to know before you buy.',
      },
      {
        question: 'Will you tell me not to buy a lot?',
        answer:
          'Yes. That recommendation is the most valuable thing an evaluation produces, and it is why we charge for the service rather than treating it as a sales call.',
      },
    ],
    costGuidance: {
      heading: 'Lot evaluation cost in the Treasure Valley',
      paragraphs: [
        'A written lot evaluation is priced for the parcel. A standard review of a serviced subdivision lot costs less, while rural acreage requiring a geotechnical report, septic feasibility testing through the health district serving the parcel, or a well yield assessment costs more.',
        'The fee is credited toward design if you build with us, and it routinely surfaces site costs that dwarf it.',
      ],
    },
  },

  'shop-homes-barndominiums': {
    slug: 'shop-homes-barndominiums',
    name: 'Shop Homes & Barndominiums',
    headline: 'Shop homes and barndominiums in the Treasure Valley',
    primaryKeyword: 'barndominium builder idaho',
    overview:
      'A shop home pairs finished living space with genuine working shop square footage under one structure. Post-frame and steel-framed construction covers large spans efficiently, which is why these builds are popular on Canyon County and rural Ada County acreage.',
    benefits: [
      'Lower cost per square foot than conventional framing on large spans',
      'Living quarters and working shop under one roof and one permit',
      'Clear-span shop space without interior structural columns',
      'Straightforward to expand later as needs change',
    ],
    inclusions: [
      'Post-frame or steel structural package engineered for Idaho loads',
      'Insulated and finished living quarters',
      'Shop slab, overhead doors, and electrical service',
      'County permits and, on rural parcels, well and septic coordination',
      'Full construction and written workmanship warranty',
    ],
    timeline:
      'Most shop homes run 6 to 9 months from permit to move-in. The shell goes up quickly compared with conventional framing; the finished living quarters drive the schedule.',
    processSteps: [
      {
        title: 'Program and ratio',
        description: 'We settle how much of the footprint is living space versus shop, which drives cost more than total size.',
      },
      {
        title: 'Site and utility review',
        description: 'Access, power capacity, and well or septic requirements checked on rural parcels.',
      },
      {
        title: 'Design and permits',
        description: 'Engineered structural package plus finished-space drawings, submitted to the county.',
      },
      {
        title: 'Build and handover',
        description: 'Shell erection, then interior finish, inspections, walkthrough, and warranty.',
      },
    ],
    faqs: [
      {
        question: 'How much does a barndominium cost to build in Idaho?',
        answer:
          'Shop homes cost less per square foot than a conventional house because the shop portion costs far less to build than finished living space. Our instant estimate has no shop home project, so it prices the two halves on their own. Its preliminary range for a 1,600 square foot new home with no garage is $316,120 to $521,450 at Essential finish and $435,310 to $717,980 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. For a 1,200 square foot detached garage or shop it is $113,770 to $187,690 at Essential finish and $144,540 to $238,450 at Signature finish, with design drawings and permit fees included and engineering, if the building needs it, not yet determined. Site work beyond a typical lot and utility connection fees are not yet determined for either. We do not add the two ranges together: a shop home puts both under one structure, so we price it from a line-item budget after a lot walkthrough.',
      },
      {
        question: 'Why is a shop home cheaper per square foot than a conventional house?',
        answer:
          'The shop portion carries far less cost than finished living space, which pulls the blended average down. Post-frame structure also spans large areas with less material. Compare finished living space directly and the gap narrows considerably.',
      },
      {
        question: 'Can I get a mortgage on a barndominium?',
        answer:
          'Often yes, though fewer lenders participate and appraisals can be harder because comparable sales are thin in some areas. Talk to a lender experienced with post-frame residential construction early, before you commit to a design.',
      },
      {
        question: 'Are shop homes allowed everywhere in Ada and Canyon County?',
        answer:
          'No. Zoning and subdivision covenants govern whether a shop-dominant structure is permitted and what it can look like. Rural and agricultural zoning is generally accommodating; master-planned subdivisions usually are not.',
      },
      {
        question: 'How well do shop homes hold up to Treasure Valley winters?',
        answer:
          'Very well when the envelope is done properly. The critical details are a continuous air barrier between shop and living space, adequate insulation, and managing condensation on steel. These are the details that separate a comfortable shop home from a cold one.',
      },
      {
        question: 'Can I finish the living space later?',
        answer:
          'Yes. Some owners build the shell and shop first, then finish the living quarters in a second phase. We design for that sequence when it fits your budget.',
      },
    ],
    costGuidance: {
      heading: 'Shop home and barndominium cost in the Treasure Valley',
      paragraphs: [
        'Our instant estimate prices the two halves of a shop home separately, as preliminary ranges dated November 2026. A 1,600 square foot new home with no garage comes to $316,120 to $521,450 at Essential finish and $435,310 to $717,980 at Signature finish, with design, engineered plans and permit fees included and the land excluded. A 1,200 square foot detached garage or shop comes to $113,770 to $187,690 at Essential finish and $144,540 to $238,450 at Signature finish, with design drawings and permit fees included and engineering not yet determined. Per square foot, that shop runs $94 to $199 at Essential to Signature finish, against $197 to $449 for the house.',
        'The instant estimate has no shop home project, so we do not add those ranges into one figure. A shop home with both under one roof is priced from a line-item budget after a lot walkthrough, and the ratio of finished space to shop space moves that budget more than any other variable, which we settle before design begins.',
      ],
    },
  },

  'energy-efficient-homes': {
    slug: 'energy-efficient-homes',
    name: 'Energy-Efficient Homes',
    headline: 'Energy-efficient home building in the Treasure Valley',
    primaryKeyword: 'energy efficient home builder boise idaho',
    overview:
      'A high-performance home costs less to operate and stays comfortable through Treasure Valley temperature swings. The work is unglamorous: a continuous air barrier, generous insulation, sealed ducts inside conditioned space, and verification by blower-door testing rather than assumption.',
    benefits: [
      'Measurably lower heating and cooling costs for the life of the home',
      'Even temperatures and no cold rooms in January',
      'Blower-door and duct-leakage testing, so performance is verified',
      'Better sound isolation and filtered air as a side effect of a tight envelope',
    ],
    inclusions: [
      'Continuous air barrier detailing and thermal bridge reduction',
      'Above-code wall, roof, and slab-edge insulation',
      'High-performance windows selected by orientation',
      'Ducts sealed and located inside conditioned space',
      'Balanced mechanical ventilation and blower-door verification',
    ],
    timeline:
      'Schedule matches a comparable custom build at 10 to 14 months, plus roughly two weeks for envelope testing and commissioning before handover.',
    processSteps: [
      {
        title: 'Performance target',
        description: 'We agree on an air-tightness and efficiency target up front, because it changes how the home is detailed.',
      },
      {
        title: 'Envelope design',
        description: 'Wall assemblies, window selection, and thermal bridge details drawn before framing, not decided on site.',
      },
      {
        title: 'Verified construction',
        description: 'Mid-build blower-door test while the air barrier is still accessible and inexpensive to correct.',
      },
      {
        title: 'Commissioning',
        description: 'Final blower-door and duct-leakage testing, ventilation balancing, and documented results.',
      },
    ],
    faqs: [
      {
        question: 'How much more does an energy-efficient home cost to build?',
        answer:
          'A well-executed high-performance envelope adds to construction cost, and the instant estimate has no option for it, so we price the envelope and mechanical upgrades in your line-item budget. Much of that is offset by being able to install smaller heating and cooling equipment.',
      },
      {
        question: 'How much will I actually save on utility bills?',
        answer:
          'Depends on the target and how the home is operated, but a 30 to 50 percent reduction against a code-minimum home of the same size is a realistic expectation in this climate. We model the specific number for your design rather than quoting a generic figure.',
      },
      {
        question: 'What is a blower-door test and why does it matter?',
        answer:
          'It pressurizes the house to measure how much air leaks through the envelope. It converts air-tightness from a claim into a number. We test mid-build, while leaks are still cheap to fix, and again at completion.',
      },
      {
        question: 'Do I need solar panels for an efficient home?',
        answer:
          'No, and panels are usually the wrong first dollar. Reducing the load through the envelope and mechanical systems is cheaper per unit of energy saved. Build tight first, then add generation if you want it.',
      },
      {
        question: 'Does a tight house have air quality problems?',
        answer:
          'Only if it is built tight without ventilation. A high-performance home includes balanced mechanical ventilation with filtration, which generally delivers better indoor air quality than a leaky house that ventilates unpredictably.',
      },
      {
        question: 'Is this worth it in the Treasure Valley climate?',
        answer:
          'Yes. The valley sees hot dry summers and cold winters, so the envelope works in both directions. Cooling load reduction in July and heating load reduction in January come from the same investment.',
      },
    ],
    costGuidance: {
      heading: 'Energy-efficient home cost in the Treasure Valley',
      paragraphs: [
        'Our instant estimate has no separate high-performance option: it gives a 2,400 square foot home with an attached 2-car garage a preliminary $502,860 to $1,135,770 at Essential to Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded, and the envelope and mechanical upgrades are priced in your line-item budget.',
        'These are preliminary ranges, not bids. Part of the premium is recovered immediately through smaller heating and cooling equipment, and the rest through operating costs over the life of the home.',
      ],
    },
  },
};

export function getAreaIntro(city: CityData): string {
  const custom = getAreaCityCopy(city.slug);
  if (custom) return custom.intro;
  const county = getCountyLabel(city.county);
  return `Boise Construction Co builds new homes for clients in ${city.name}, Idaho and throughout ${county}. From fully custom homes and semi-custom plans to building on land you already own, you work with one accountable team from feasibility through final walkthrough.`;
}

/** Sister company that owns remodeling, conversions and interior additions. */
export const REMODELING_SITE_URL = 'https://boiseremodeling.co';
/** Remodeling's ADU conversion page (SEO audit XS-10). */
export const REMODELING_ADU_URL = `${REMODELING_SITE_URL}/services/adu`;
/** Remodeling's room addition and bump-out page (portfolio audit 1.5). */
export const REMODELING_ROOM_ADDITION_URL = `${REMODELING_SITE_URL}/services/room-addition`;

/**
 * The ADU and additions split between the two P5 Home Co sites, stated on the
 * page: this site builds new detached ADUs and structural additions (new
 * footprint, second stories); Boise Remodeling Co handles interior remodels,
 * garage or basement ADU conversions and work inside the existing footprint.
 * One followed contextual link to boiseremodeling.co, never more.
 */
export function getScopeSplitSection(serviceSlug: string, cityName?: string): LandingSection | undefined {
  const where = cityName ? ` in ${cityName}` : '';
  if (serviceSlug === 'adu') {
    // SEO audit XS-10: the handoff links Remodeling's ADU conversion page,
    // with the anchor the audit gives for the hub and each indexed city page.
    const conversionAnchor =
      cityName === 'Boise'
        ? 'garage and basement ADU conversions in Boise'
        : cityName === 'Meridian'
          ? 'ADU conversions by Boise Remodeling Co'
          : 'ADU conversions at Boise Remodeling Co';
    const conversionSentence =
      cityName === 'Boise'
        ? 'Converting a garage or a basement into an attached ADU, or remodeling rooms inside the house, is interior work: our sister company Boise Remodeling Co handles garage and basement ADU conversions in Boise.'
        : `Converting a garage or a basement into an attached ADU, or remodeling rooms inside the house, is interior work: see ${conversionAnchor}, our sister company.`;
    return {
      heading: `New detached ADUs${where}, not conversions`,
      paragraphs: [
        `Boise Construction Co builds new detached ADUs and guest houses${where}: a separate dwelling on the lot you already own, from setbacks and utilities through permits and construction.`,
        conversionSentence,
      ],
      paragraphLinks: [undefined, [{ phrase: conversionAnchor, href: REMODELING_ADU_URL }]],
    };
  }
  if (serviceSlug === 'home-additions') {
    return {
      heading: `Structural additions${where}: new footprint or a second story`,
      paragraphs: [
        `Boise Construction Co builds structural home additions${where}: new footprint on the lot or a second story over the house you already live in, tied into the existing structure, roofline and utilities.`,
        // One sentence on which brand builds which addition (portfolio audit 1.5).
        'Bump-outs that extend a kitchen, bathroom or great room a few feet, conversions of existing space into new rooms, and remodels inside the footprint are built by our sister company: see room additions at Boise Remodeling Co.',
      ],
      paragraphLinks: [undefined, [{ phrase: 'room additions at Boise Remodeling Co', href: REMODELING_ROOM_ADDITION_URL }]],
    };
  }
  return undefined;
}

export function getCityServiceIntro(
  service: ServiceSEOContent,
  city: CityData,
  localFact?: string,
): string {
  const custom = getCityServiceCopy(service.slug, city.slug);
  if (custom) return custom.intro;
  const county = getCountyLabel(city.county);
  const fact = localFact
    ? ` ${localFact}`
    : ` We know ${county} plan review requirements, impact fees, and the lot conditions common around ${city.name}.`;
  return `Planning ${service.name.toLowerCase()} in ${city.name}, Idaho?${fact} Boise Construction Co works design-build, with a line-item budget, weekly written updates, and a written workmanship warranty. Book a free planning consultation or use our estimator for a planning range.`;
}

export function getCityServiceFaqs(service: ServiceSEOContent, city: CityData): FAQItem[] {
  const custom = getCityServiceCopy(service.slug, city.slug);
  if (custom) return custom.faqs;
  const county = getCountyLabel(city.county);
  // First sentence of the cost band, reused as a direct city-level answer for
  // "{service} cost in {city}" queries (voice/AI extractable).
  const costSentence = service.costGuidance
    ? `${service.costGuidance.paragraphs[0].split('. ')[0]}.`
    : undefined;
  return [
    ...(costSentence
      ? [
          {
            question: cityServiceCostQuestion(service, city.name),
            answer: `${city.name} pricing tracks the broader Treasure Valley market. ${costSentence} Book a lot walkthrough for a line-item budget specific to your site.`,
          },
        ]
      : []),
    ...service.faqs.filter((faq) => !costSentence || !/^how much\b/i.test(faq.question)).slice(0, 2),
    {
      question: `Do you build in ${city.name}?`,
      answer: `Yes. We regularly build in ${city.name} and the surrounding ${county} area, and we are familiar with the local plan review process and impact fees.`,
    },
    {
      question: cityServiceBudgetQuestion(service, city.name),
      answer: `Request a quote for a planning conversation, then book a free planning consultation. If you have a lot under consideration, we will walk it with you and identify what will drive the site costs.`,
    },
  ];
}

/**
 * Build localized long-form sections for a city x service page. This is the
 * core doorway-page mitigation: instead of a single keyword-swapped paragraph,
 * each page gets service-scoped local substance (neighborhoods, landmarks,
 * climate, and county permit specifics) drawn from CITY_SEO_DATA. See
 * seo-audit/doorway-page-analysis.md.
 */
export function getCityServiceSections(
  service: ServiceSEOContent,
  city: CityData,
  seo: CitySeoFacts | undefined,
): LandingSection[] {
  const county = getCountyLabel(city.county);
  const neighborhoods = seo?.neighborhoods ?? [];
  const landmarks = seo?.landmarks ?? [];
  const creek = indianCreekDescription(city.name);
  const serviceLC = service.name.toLowerCase();

  const conceptFigure =
    city.slug === 'eagle'
      ? {
          src: '/images/projects/eagle-mountain-modern/eagle-custom-home-kitchen.webp',
          caption: `Rift-cut white oak kitchen with a black quartzite island.`,
        }
      : {
          src: '/images/construction/new-home-kitchen.webp',
          caption: `Kitchen finishes for Treasure Valley ${serviceLC}.`,
        };

  const sections: LandingSection[] = [
    // Server-rendered cost bands (extractable by crawlers and AI engines,
    // unlike the client-side estimator). See local-seo-audit/10-aeo-geo-plan.md.
    ...(service.costGuidance
      ? [
          {
            heading: `${serviceLabel(service)} cost in ${city.name}`,
            paragraphs: [
              `Planning ranges for ${city.name} match the broader Treasure Valley market. ${service.costGuidance.paragraphs[0]}`,
              service.costGuidance.paragraphs[1],
            ],
            links: [
              {
                label: 'Boise home building cost guide',
                href: '/guides/boise-home-building-cost-guide',
              },
            ],
            figure: conceptFigure,
          },
        ]
      : []),
    {
      heading: `${serviceLabel(service)} across ${city.name}`,
      paragraphs: [
        neighborhoods.length
          ? `We build throughout ${city.name}, including ${neighborhoods.join(', ')}.${creek ? ` ${creek}` : ''} Lot conditions, utility access, and subdivision design standards vary between these areas, so we tailor the site plan, foundation, and elevations to the specific parcel rather than dropping a plan onto it.`
          : creek
            ? `We build throughout ${city.name}. ${creek} We tailor the site plan, foundation design, and elevations to the specific parcel rather than dropping a plan onto it.`
            : `We build throughout ${city.name}, tailoring the site plan, foundation design, and elevations to the specific parcel rather than dropping a plan onto it.`,
        landmarks.length
          ? `As a local team familiar with ${city.name} landmarks like ${landmarks.slice(0, 3).join(', ')}, we understand how the area is developing and plan ${serviceLC} that fits the neighborhood and holds its value.`
          : `As a local team, we plan ${serviceLC} that fits the neighborhood and holds its value.`,
      ],
      figure: {
        src:
          city.slug === 'eagle'
            ? '/images/projects/eagle-mountain-modern/eagle-custom-home-front-exterior.webp'
            : '/images/construction/custom-home-exterior.webp',
        caption:
          city.slug === 'eagle'
            ? `Mountain-modern charcoal stucco and ledgestone exterior for ${serviceLC} in ${city.name}.`
            : `Home exterior with dark vertical siding and a wood-clad entry.`,
      },
    },
    {
      heading: `New construction permits and plan review in ${city.name}`,
      paragraphs: [
        permitGuidance(city.name),
        'Addresses outside city limits go through the county instead; we check this for you at the first visit.',
        seo?.climate
          ? `Our ${city.name} designs also account for the local ${seo.climate}, from insulation and ventilation choices to frost depth, snow load, and materials that hold up to Treasure Valley freeze-thaw cycles.`
          : `Our ${city.name} designs account for the local Treasure Valley climate, including frost depth, snow load, insulation levels, and durable exterior materials.`,
      ],
      links: [
        { label: `${city.name} home builder overview`, href: `/areas/${city.slug}` },
        ...(permitSource(city.name)?[{label:`Official ${city.name} permit guidance`,href:permitSource(city.name)!}]:[]),
        { label: 'Ada vs Canyon County permit timelines', href: '/resources/ada-canyon-permit-flow' },
      ],
    },
  ];

  return sections;
}

export const AREA_PAGE_FAQS: FAQItem[] = [
  {
    question: 'What kinds of homes do you build?',
    answer:
      'Fully custom homes, semi-custom homes from adapted plans, builds on land you already own, shop homes, and ADUs. We also provide design and lot evaluation as standalone services.',
  },
  {
    question: 'Are you a registered contractor and insured?',
    answer:
      'Yes. P5 Home Co LLC, Idaho Registered Contractor #8381215, insured. Certificate on request.',
  },
  {
    question: 'How do I start a project?',
    answer:
      'Call us, request a quote, or book a free planning consultation through our website.',
  },
];

export const HOMEPAGE_FAQS_FOR_SCHEMA: FAQItem[] = [
  {
    question: 'How much does it cost to build a house in the Treasure Valley?',
    answer:
      'Our instant estimate gives a 2,400 square foot home with an attached 2-car garage a preliminary range of $502,860 to $829,330 at Essential finish and $688,660 to $1,135,770 at Signature finish (November 2026), with design, engineered plans and permit fees included and the land excluded. Site work beyond a typical lot is budgeted separately.',
  },
  {
    question: 'How are you different from other home builders in the Treasure Valley?',
    answer:
      'We publish our numbers. You get a line-item budget rather than a lump sum, allowance amounts based on real local pricing, and a written weekly cost and schedule update for the life of the build.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      SERVICE_AREA_LINE + '.',
  },
  {
    question: 'How long does it take to build a new home?',
    answer:
      'Plan on 10 to 14 months for a custom home and 7 to 10 months for a semi-custom home, measured from the start of design to move-in. County plan review is the most common source of delay.',
  },
  {
    question: 'Do you handle permits?',
    answer:
      'Yes. Building permits, plan review, impact fees, and inspections are included in our scope for Ada and Canyon County, including septic and well permitting on rural parcels.',
  },
];
