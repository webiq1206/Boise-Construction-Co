import type { ServiceData, CityData } from './contentData';
import { getCountyLabel } from './contentData';
import type { LandingSection } from '@/components/seo/LandingPageTemplate';

export interface FAQItem {
  question: string;
  answer: string;
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
 * Cost figures below are 2026 Treasure Valley planning ranges for new
 * residential construction, quoted per finished square foot and excluding land
 * unless stated. They are anchored to the local market range of roughly $225
 * to $400 per square foot and must stay consistent with the estimator engine
 * and the pillar cost guides.
 */
export const SERVICE_SEO_CONTENT: Record<string, ServiceSEOContent> = {
  'custom-home-builder': {
    slug: 'custom-home-builder',
    name: 'Custom Home Building',
    headline: 'Custom Home Builder in the Treasure Valley',
    primaryKeyword: 'custom home builder boise idaho',
    overview:
      'A custom home starts from a blank page rather than a catalog. Boise Construction Co handles feasibility, design, engineering, permitting, and construction under one contract, so the drawings, the budget, and the schedule stay tied together from the first sketch to the day you get the keys.',
    benefits: [
      'One team and one contract from feasibility through final walkthrough',
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
      'Plan on 10 to 14 months end to end: roughly 3 to 5 months for design, engineering, and permitting, then 7 to 10 months of construction depending on size and site complexity.',
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
        title: 'Design and fixed scope',
        description: 'Drawings, selections, and a line-item budget are locked together before we submit for permit.',
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
          'Most Treasure Valley custom homes plan between $250 and $400 per finished square foot in 2026, excluding land, with our simplest single-level designs starting near $525,000. A common 2,400 square foot custom home lands between $600,000 and $960,000. Foothills lots and highly detailed designs run above that range.',
      },
      {
        question: 'How long does it take to build a custom home in the Treasure Valley?',
        answer:
          'Budget 10 to 14 months from the start of design to move-in. Design, engineering, and permitting take 3 to 5 months, and construction runs 7 to 10 months. Plan review timelines in Ada and Canyon County are the most common source of delay.',
      },
      {
        question: 'Do I need to own land before I contact a builder?',
        answer:
          'No, and it is often better if you have not bought yet. We review candidate lots for soils, utilities, access, and setback constraints before you commit, because the parcel drives a large share of the final budget.',
      },
      {
        question: 'What is not included in a per-square-foot price?',
        answer:
          'Per-square-foot figures cover vertical construction. Land, site work, well and septic on rural parcels, impact fees, landscaping, fencing, and window coverings sit outside that number. We itemize each one so nothing surfaces late.',
      },
      {
        question: 'How do you handle budget changes during construction?',
        answer:
          'Every change is priced and approved in writing before the work happens. You see the running cost against the original line-item budget in your weekly update, so there is no reconciliation surprise at the end.',
      },
      {
        question: 'Do you build on rural acreage outside city limits?',
        answer:
          'Yes. Rural parcels in Ada and Canyon County usually need a well, a septic system permitted through Central District Health, and sometimes private road or power extension. That work commonly adds $80,000 to $150,000 before a foundation is poured, so we price it during feasibility.',
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
        'As of 2026, most Treasure Valley custom homes plan between $250 and $400 per finished square foot excluding land. Our published planning-from figure of $525,000 reflects the simplest single-level designs on flat valley lots, near $225 per square foot; a common 2,400 square foot home lands between $600,000 and $960,000, and foothills sites, steep grades, and highly detailed interiors regularly exceed $450 per square foot.',
        'These are planning ranges, not bids. Lot conditions, home size, roof and wall complexity, and finish level drive the final number, which we confirm with a line-item budget after a lot walkthrough.',
      ],
    },
  },

  'semi-custom-homes': {
    slug: 'semi-custom-homes',
    name: 'Semi-Custom Homes',
    headline: 'Semi-Custom Home Building in the Treasure Valley',
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
          'Semi-custom homes generally plan between $225 and $300 per finished square foot in 2026, excluding land, with our simplest plans starting near $425,000. A common 2,000 square foot home lands between $450,000 and $600,000.',
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
        'As of 2026, semi-custom homes in the Treasure Valley plan between $225 and $300 per finished square foot excluding land. Our published planning-from figure of $425,000 reflects the simplest plans; a common 2,000 square foot home lands between $450,000 and $600,000. The savings against a fully custom build come from design and engineering work that is already complete, not from cheaper construction.',
        'These are planning ranges, not bids. Lot conditions, plan modifications, and finish level move the number, which we confirm with a line-item budget once a plan and lot are matched.',
      ],
    },
  },

  'build-on-your-lot': {
    slug: 'build-on-your-lot',
    name: 'Build on Your Lot',
    headline: 'Build on Your Lot in the Treasure Valley',
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
          'Vertical construction plans between $225 and $400 per finished square foot in 2026. Site work is separate and varies enormously: a serviced lot in a Meridian subdivision might need $25,000 to $50,000, while rural acreage requiring a well, septic, and access can run $80,000 to $150,000.',
      },
      {
        question: 'How do I know if my lot is actually buildable?',
        answer:
          'Buildability comes down to soils, utility access, legal access, setbacks, slope, and floodplain status. We review all six before design begins, and we will tell you if a parcel is not worth building on.',
      },
      {
        question: 'Do I need a well and septic on rural Ada or Canyon County land?',
        answer:
          'If municipal water and sewer are not at the property line, yes. Septic systems are permitted through Central District Health and wells through the Idaho Department of Water Resources. Together they commonly add $35,000 to $70,000, more if the well has to go deep.',
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
          'Yes, and that is the better sequence. Our lot evaluation service reviews a parcel before purchase so you are not discovering a $90,000 access problem after closing.',
      },
    ],
    costGuidance: {
      heading: 'Build on your lot cost in the Treasure Valley',
      paragraphs: [
        'As of 2026, vertical construction on an owned lot plans between $225 and $400 per finished square foot, and site work is budgeted separately. Serviced lots inside city limits commonly need $25,000 to $50,000 of site work, while rural parcels requiring a well, septic system, and access improvements run $80,000 to $150,000 before the foundation is poured.',
        'These are planning ranges, not bids. Because the parcel drives so much of the number, we produce a written feasibility summary for your specific lot before design begins.',
      ],
    },
  },

  'design-build': {
    slug: 'design-build',
    name: 'Design-Build',
    headline: 'Design-Build Home Construction in the Treasure Valley',
    primaryKeyword: 'design build home builder boise idaho',
    overview:
      'Design-build puts the drawings and the construction under one contract. Instead of hiring an architect, bidding the finished plans, and discovering the design costs 40 percent more than you budgeted, the design is priced continuously as it develops.',
    benefits: [
      'Design priced as it develops, so the drawings never outrun the budget',
      'One contract and one point of accountability instead of two',
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
          'Design and construction sit under one contract with one company. You have a single point of accountability, and the design is priced continuously rather than bid once it is finished.',
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
          'Design, engineering, and permit-ready documents typically run 5 to 12 percent of construction cost, which is roughly $9,000 to $35,000 for most Treasure Valley homes. On a design-build contract a portion of that credits toward construction.',
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
        'As of 2026, design-build homes in the Treasure Valley plan between $250 and $400 per finished square foot excluding land. The design and engineering portion typically represents 5 to 12 percent of construction cost, or about $9,000 to $35,000 for a typical home, and is folded into a single contract rather than billed separately.',
        'These are planning ranges, not bids. The advantage of design-build is that your number gets more precise at every design milestone instead of arriving all at once when drawings go out to bid.',
      ],
    },
  },

  'home-plans-design': {
    slug: 'home-plans-design',
    name: 'Home Design & Plans',
    headline: 'Custom Home Design and Plans in the Treasure Valley',
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
          'A permit-ready set with structural engineering typically runs 5 to 12 percent of construction cost, roughly $9,000 to $35,000 for most Treasure Valley homes. Small or simple homes sit at the low end; large or architecturally complex homes sit above it.',
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
        'As of 2026, a permit-ready custom home drawing set with structural engineering and energy compliance runs roughly $9,000 to $35,000 in the Treasure Valley, or about 5 to 12 percent of construction cost. Simple single-level homes sit near the bottom of that range and large or complex designs above it.',
        'These are planning ranges, not bids. Home size, structural complexity, and the number of design revision rounds drive the final figure, which we fix in writing after a programming session.',
      ],
    },
  },

  'home-additions': {
    slug: 'home-additions',
    name: 'Home Additions',
    headline: 'Home Additions in the Treasure Valley',
    primaryKeyword: 'home additions boise idaho',
    overview:
      'When your home still fits the neighborhood but no longer fits your life, an addition can make room without starting over. Boise Construction Co plans room additions around the house already standing, from the first look at structure and utilities through permits, construction, and the final walkthrough.',
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
          'Room additions can create a bedroom, a larger living area, a suite, or flexible space for changing household needs. The first step is seeing how the new space can connect to the existing home.',
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
    headline: 'Lot Evaluation and Site Feasibility in the Treasure Valley',
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
      'A standard lot evaluation takes 2 to 4 weeks. Parcels needing a formal geotechnical report or a septic feasibility test through Central District Health can take 4 to 8 weeks.',
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
          'A standard Treasure Valley lot evaluation runs $950 to $3,500 depending on parcel size and whether a geotechnical report or septic feasibility test is needed. The fee is credited toward design if you go on to build with us.',
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
        'As of 2026, a written lot evaluation in the Treasure Valley runs $950 to $3,500. A standard review of a serviced subdivision lot sits near the lower end, while rural acreage requiring a geotechnical report, septic feasibility testing through Central District Health, or a well yield assessment sits at the upper end.',
        'These are planning ranges, not bids. The fee is credited toward design if you build with us, and it routinely surfaces site costs that dwarf it.',
      ],
    },
  },

  'shop-homes-barndominiums': {
    slug: 'shop-homes-barndominiums',
    name: 'Shop Homes & Barndominiums',
    headline: 'Shop Homes and Barndominiums in the Treasure Valley',
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
          'Shop homes generally plan between $140 and $250 per square foot in 2026, blended across finished and shop space. Our published planning-from figure of $330,000 reflects a smaller living area with a larger shop-to-house ratio, since the shop portion costs far less per square foot. A 1,600 square foot living area with an attached 1,200 square foot shop commonly lands between $385,000 and $630,000 excluding land. The shop itself runs about $55 to $60 per square foot insulated, with a slab, an overhead door and power.',
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
        'As of 2026, shop homes in the Treasure Valley plan between $140 and $250 per square foot blended across finished and shop space. Our published planning-from figure of $330,000 reflects a smaller living area with a larger shop-to-house ratio; a 1,600 square foot living area with an attached 1,200 square foot shop commonly runs $385,000 to $630,000 excluding land and site work.',
        'These are planning ranges, not bids. The ratio of finished space to shop space moves the blended cost more than any other variable, which we settle before design begins.',
      ],
    },
  },

  'energy-efficient-homes': {
    slug: 'energy-efficient-homes',
    name: 'Energy-Efficient Homes',
    headline: 'Energy-Efficient Home Building in the Treasure Valley',
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
          'A well-executed high-performance envelope typically adds 3 to 8 percent to construction cost, roughly $20,000 to $55,000 on a mid-size Treasure Valley home. Much of that is offset by being able to install smaller heating and cooling equipment.',
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
        'As of 2026, high-performance homes in the Treasure Valley plan between $275 and $425 per finished square foot excluding land. Our published planning-from figure of $575,000 reflects a smaller or simpler high-performance home; the envelope and mechanical upgrades that separate it from a code-minimum build typically add 3 to 8 percent on top of your base home cost, or about $20,000 to $55,000 on a mid-size home.',
        'These are planning ranges, not bids. Part of the premium is recovered immediately through smaller heating and cooling equipment, and the rest through operating costs over the life of the home.',
      ],
    },
  },
};

export function getAreaIntro(city: CityData): string {
  const county = getCountyLabel(city.county);
  return `Boise Construction Co builds new homes for clients in ${city.name}, Idaho and throughout ${county}. From fully custom homes and semi-custom plans to building on land you already own, you work with one accountable team from feasibility through final walkthrough.`;
}

export function getCityServiceIntro(
  service: ServiceSEOContent,
  city: CityData,
  localFact?: string,
): string {
  const county = getCountyLabel(city.county);
  const fact = localFact
    ? ` ${localFact}`
    : ` We know ${county} plan review requirements, impact fees, and the lot conditions common around ${city.name}.`;
  return `Planning ${service.name.toLowerCase()} in ${city.name}, Idaho?${fact} Boise Construction Co works design-build, with a line-item budget, weekly written updates, and a written workmanship warranty. Book a free planning consultation or use our estimator for a planning range.`;
}

export function getCityServiceFaqs(service: ServiceSEOContent, city: CityData): FAQItem[] {
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
            question: `How much does ${service.name.toLowerCase()} cost in ${city.name}?`,
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
      question: `How do I get a budget for ${service.name.toLowerCase()} in ${city.name}?`,
      answer: `Use our online estimator for a planning range, then book a free planning consultation. If you have a lot under consideration, we will walk it with you and identify what will drive the site costs.`,
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
  const serviceLC = service.name.toLowerCase();

  const sections: LandingSection[] = [
    // Server-rendered cost bands (extractable by crawlers and AI engines,
    // unlike the client-side estimator). See local-seo-audit/10-aeo-geo-plan.md.
    ...(service.costGuidance
      ? [
          {
            heading: `${service.name} cost in ${city.name}`,
            paragraphs: [
              `Planning ranges for ${city.name} match the broader Treasure Valley market. ${service.costGuidance.paragraphs[0]}`,
              service.costGuidance.paragraphs[1],
            ],
            links: [
              {
                label: 'Boise Home Building Cost Guide',
                href: '/guides/boise-home-building-cost-guide',
              },
            ],
          },
        ]
      : []),
    {
      heading: `${service.name} across ${city.name}`,
      paragraphs: [
        neighborhoods.length
          ? `We build throughout ${city.name}, including ${neighborhoods.join(', ')}. Lot conditions, utility access, and subdivision design standards vary between these areas, so we tailor the site plan, foundation, and elevations to the specific parcel rather than dropping a plan onto it.`
          : `We build throughout ${city.name}, tailoring the site plan, foundation design, and elevations to the specific parcel rather than dropping a plan onto it.`,
        landmarks.length
          ? `As a local team familiar with ${city.name} landmarks like ${landmarks.slice(0, 3).join(', ')}, we understand how the area is developing and plan ${serviceLC} that fits the neighborhood and holds its value.`
          : `As a local team, we plan ${serviceLC} that fits the neighborhood and holds its value.`,
      ],
    },
    {
      heading: `New construction permits and plan review in ${county}`,
      paragraphs: [
        `New home construction in ${city.name} requires a building permit, plan review, and impact fees through ${county}. Residential plan review commonly runs 3 to 6 weeks, and parcels outside municipal service need septic approval through Central District Health and a well permit through the Idaho Department of Water Resources. We build those timelines into your schedule from day one and handle submissions, fees, and inspections as part of the contract.`,
        seo?.climate
          ? `Our ${city.name} designs also account for the local ${seo.climate}, from insulation and ventilation choices to frost depth, snow load, and materials that hold up to Treasure Valley freeze-thaw cycles.`
          : `Our ${city.name} designs account for the local Treasure Valley climate, including frost depth, snow load, insulation levels, and durable exterior materials.`,
      ],
      links: [
        { label: `${city.name} home builder overview`, href: `/areas/${city.slug}` },
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
      'Fully custom homes, semi-custom homes from adapted plans, builds on land you already own, and shop homes. We also provide design and lot evaluation as standalone services.',
  },
  {
    question: 'Are you licensed and insured?',
    answer:
      'Yes. Boise Construction Co is licensed, bonded, and insured. Idaho contractor registration details are available on request.',
  },
  {
    question: 'How do I start a project?',
    answer:
      'Call us, use our construction estimator for a planning range, or book a free planning consultation through our website.',
  },
];

export const HOMEPAGE_FAQS_FOR_SCHEMA: FAQItem[] = [
  {
    question: 'How much does it cost to build a house in the Treasure Valley?',
    answer:
      'Most Treasure Valley new homes plan between $225 and $400 per finished square foot in 2026, excluding land. A 2,400 square foot custom home commonly lands between $600,000 and $960,000, with site work budgeted separately.',
  },
  {
    question: 'How are you different from other home builders in the Treasure Valley?',
    answer:
      'We publish our numbers. You get a line-item budget rather than a lump sum, allowance amounts based on real local pricing, and a written weekly cost and schedule update for the life of the build.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, and the greater Treasure Valley.',
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
