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

export const SERVICE_SEO_CONTENT: Record<string, ServiceSEOContent> = {
  'kitchen-remodel': {
    slug: 'kitchen-remodel',
    name: 'Kitchen Remodel',
    headline: 'Kitchen Remodeling in the Treasure Valley',
    primaryKeyword: 'kitchen remodeling boise idaho',
    overview:
      'A well-planned kitchen remodel improves how your family cooks, gathers, and moves through the home. Boise Remodeling Co handles design, permitting, and construction under one roof so layout, cabinetry, lighting, and finishes stay aligned from first visit to final walkthrough.',
    benefits: [
      'Single design-build team, no juggling separate designers and contractors',
      'Written scope and finish selections before construction begins',
      'Ada and Canyon County permits handled in-house',
      'Weekly written schedule updates every Friday',
    ],
    inclusions: [
      'Layout planning and design direction',
      'Cabinetry, countertops, and backsplash coordination',
      'Lighting and electrical updates as needed',
      'Plumbing adjustments for sinks and fixtures',
      'Dust barriers, floor protection, and daily cleanup',
    ],
    timeline: 'Most kitchen remodels run 6 to 10 weeks from permit approval, depending on layout changes and custom lead times.',
    processSteps: [
      { title: 'In-home consultation', description: 'We walk your space, discuss goals, and share a planning range on the spot.' },
      { title: 'Design and scope', description: 'You receive selections guidance and a written scope with your project investment.' },
      { title: 'Permits and scheduling', description: 'We file permits and build a week-by-week schedule before demo day.' },
      { title: 'Construction and walkthrough', description: 'Our crew executes the plan; you receive a final walkthrough and workmanship guarantee.' },
    ],
    faqs: [
      {
        question: 'How much does a kitchen remodel cost in the Treasure Valley?',
        answer:
          'Investment depends on size, layout changes, and finish level. Use our project estimator for a planning range, then schedule a free in-home visit for a written scope tailored to your home.',
      },
      {
        question: 'Can I use my kitchen during the remodel?',
        answer:
          'For many projects, yes with temporary setups. We install dust barriers and protect adjacent rooms. We will be honest about timeline impacts during your consultation.',
      },
      {
        question: 'Do you handle permits for kitchen remodels?',
        answer:
          'Yes. Permits are included and managed in-house for Ada and Canyon County jurisdictions.',
      },
      {
        question: 'How long does a kitchen remodel take in Boise?',
        answer:
          'Most kitchen remodels run 6 to 10 weeks of construction after permit approval. Cabinet lead times can add several weeks before demo, so design lock is the real schedule driver.',
      },
      {
        question: 'Do I need a permit to remodel a kitchen in Idaho?',
        answer:
          'Cosmetic updates like paint and counters usually do not. Layout changes, new circuits, moved plumbing, or structural work require permits through Ada or Canyon County. We confirm the permit path during your consultation and handle submissions in-house.',
      },
      {
        question: 'Should I move walls or keep my existing kitchen layout?',
        answer:
          'Keeping plumbing and walls in place saves meaningful budget. We recommend layout changes only when they solve a real problem, like isolation from the living space or unworkable traffic flow, and we price both paths so you can decide.',
      },
      {
        question: 'Do you supply appliances?',
        answer:
          'Appliances are client-supplied. We guide selection, coordinate rough-in dimensions, and schedule around delivery, but we do not purchase or install appliances.',
      },
      {
        question: 'What kitchen upgrades add the most resale value in the Treasure Valley?',
        answer:
          'Mid-range kitchen updates aligned with your neighborhood comps deliver the most reliable return: quality cabinetry, quartz counters, and improved lighting. Over-improving beyond your street rarely pays back at sale.',
      },
    ],
    costGuidance: {
      heading: 'Kitchen remodel cost in the Treasure Valley',
      paragraphs: [
        'As of 2026, most Treasure Valley kitchen remodels plan between $35,000 and $75,000 for mid-range scope: new cabinetry, quartz or granite counters, tile backsplash, and updated plumbing and electrical. Cosmetic refreshes can start near $15,000, while full gut renovations with layout changes, custom cabinetry, and premium finishes commonly run $75,000 to $150,000 or more.',
        'These are planning ranges, not bids. Size, layout changes, and finish level drive the final number, which we confirm with a written scope after your free in-home visit.',
      ],
    },
  },
  'bathroom-remodel': {
    slug: 'bathroom-remodel',
    name: 'Bathroom Remodel',
    headline: 'Bathroom Remodeling in the Treasure Valley',
    primaryKeyword: 'bathroom remodeling boise idaho',
    overview:
      'Bathroom remodels should feel calm, functional, and built to last. We design primary baths, guest baths, and powder rooms with clear expectations, proactive communication, and finishes chosen for Idaho homes.',
    benefits: [
      'Design-build accountability from layout through tile and fixtures',
      'Waterproofing and plumbing scope defined in writing',
      'Transparent project investment, no surprise line-item games',
      'Written workmanship guarantee on our labor',
    ],
    inclusions: [
      'Vanity, shower, and tub planning',
      'Tile, flooring, and fixture selections guidance',
      'Ventilation and lighting improvements',
      'Plumbing and electrical updates as scoped',
      'Daily protection of adjacent living spaces',
    ],
    timeline: 'Typical bathroom remodels complete in 3 to 5 weeks after permits, depending on custom materials and layout changes.',
    processSteps: [
      { title: 'Consultation', description: 'We assess your bath, discuss storage and accessibility needs, and outline a planning range.' },
      { title: 'Selections and scope', description: 'Finishes and fixtures are documented before demolition.' },
      { title: 'Build', description: 'Licensed trades coordinate waterproofing, tile, and trim with weekly updates.' },
      { title: 'Final walkthrough', description: 'We review every detail with you before sign-off.' },
    ],
    faqs: [
      {
        question: 'How long does a bathroom remodel take?',
        answer: 'Most projects run 3 to 5 weeks from permit approval. Larger primary baths with layout changes may take longer.',
      },
      {
        question: 'Can you remodel a bathroom without moving plumbing?',
        answer: 'Yes. Cosmetic and mid-scope updates can keep existing plumbing locations. We will recommend layout changes only when they add real value.',
      },
      {
        question: 'Do you work in both Ada and Canyon County?',
        answer: 'Yes. We serve Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, and surrounding Treasure Valley communities.',
      },
      {
        question: 'How much does a bathroom remodel cost in Boise?',
        answer:
          'Guest and hall bath remodels often plan $18,000 to $45,000; primary baths with curbless showers, double vanities, or layout changes commonly run $35,000 to $85,000 or more. Your written scope confirms the number after an in-home visit.',
      },
      {
        question: 'Do I need a permit for a bathroom remodel in Idaho?',
        answer:
          'Like-for-like fixture swaps usually do not require permits. Moving plumbing, adding circuits, changing layout, or altering structure does. We confirm the permit path for your address and handle Ada or Canyon County submissions in-house.',
      },
      {
        question: 'What is a curbless shower and is it worth it?',
        answer:
          'A curbless shower has no step or threshold, which looks cleaner and works for aging-in-place. It requires recessing the floor and careful waterproofing and slope, so it is easiest to plan during a full remodel rather than as a retrofit.',
      },
      {
        question: 'How do you prevent water damage and mold in a remodeled bathroom?',
        answer:
          'Waterproofing membrane systems behind tile, correct shower slope, and properly sized ventilation are all defined in the written scope and inspected during construction. Ventilation matters in our dry climate more than most homeowners expect.',
      },
      {
        question: 'Can you make a bathroom work for aging in place without looking clinical?',
        answer:
          'Yes. Curbless entries, blocking for future grab bars, comfort-height vanities, and slip-resistant tile can be designed into a bathroom that looks like a spa, not a hospital.',
      },
    ],
    costGuidance: {
      heading: 'Bathroom remodel cost in the Treasure Valley',
      paragraphs: [
        'As of 2026, guest bathroom remodels in the Boise area typically plan $18,000 to $45,000. Primary bathroom remodels with walk-in or curbless showers, double vanities, and tile work commonly plan $35,000 to $85,000 or more depending on layout changes and finish level.',
        'These are planning ranges, not bids. Waterproofing scope, plumbing relocations, and fixture selections drive the final number, which we confirm in a written scope after your free in-home visit.',
      ],
    },
  },
  'whole-home-remodel': {
    slug: 'whole-home-remodel',
    name: 'Whole-Home Remodel',
    headline: 'Whole-Home Remodeling in the Treasure Valley',
    primaryKeyword: 'whole home remodeling boise idaho',
    overview:
      'Whole-home remodeling brings multiple rooms into one cohesive plan, open concepts, updated systems, new finishes, and better flow. Our design-build approach keeps one team accountable across phases so your home feels intentional, not piecemeal.',
    benefits: [
      'Phased scheduling to balance livability and progress',
      'Unified design language across rooms',
      'Single point of contact for scope, budget, and schedule',
      'Experience with Treasure Valley homes from ranchers to new construction',
    ],
    inclusions: [
      'Whole-home planning and prioritization',
      'Structural and layout changes as scoped',
      'Flooring, paint, and trim packages',
      'Kitchen and bath updates within the master plan',
      'Permit coordination across trades',
    ],
    timeline: 'Whole-home renovations typically run 3 to 6 months depending on scope, phasing, and permit timelines.',
    processSteps: [
      { title: 'Discovery', description: 'We map goals room by room and identify must-haves vs. nice-to-haves.' },
      { title: 'Master scope', description: 'A written plan sequences work to minimize disruption.' },
      { title: 'Phased construction', description: 'Trades follow an agreed schedule with Friday written updates.' },
      { title: 'Completion', description: 'Final walkthrough covers every space in the scope.' },
    ],
    faqs: [
      {
        question: 'Can we live in the home during a whole-home remodel?',
        answer:
          'Sometimes yes, sometimes no. We will give you an honest assessment based on HVAC, electrical, and dust exposure during your consultation.',
      },
      {
        question: 'How do you keep a large project on budget?',
        answer:
          'Written scope, documented selections, and change orders for any additional work, all approved before we proceed.',
      },
      {
        question: 'Is design-build better than hiring separate contractors?',
        answer:
          'For multi-room work, design-build reduces coordination risk and keeps design intent intact through construction.',
      },
      {
        question: 'How much does a whole-home remodel cost in the Treasure Valley?',
        answer:
          'Whole-home programs commonly plan $150,000 to $400,000 or more depending on square footage, structural changes, and finish level. Phasing can spread the investment; a written master scope keeps phases cohesive.',
      },
      {
        question: 'Should I remodel everything at once or in phases?',
        answer:
          'One mobilization is usually cheaper and faster overall, but phasing can fit cash flow and livability. We price both approaches against one master plan so finishes and systems stay consistent either way.',
      },
      {
        question: 'How long does a whole-home remodel take?',
        answer:
          'Most run 3 to 6 months of construction; large structural programs can run longer. Design, engineering, and permits add 6 to 12 weeks before construction starts.',
      },
      {
        question: 'Is it better to remodel or move in the Boise market?',
        answer:
          'Compare total cost of ownership: selling costs, moving costs, and current mortgage rates against the remodel investment. Many Treasure Valley homeowners with low locked-in rates find remodeling wins. We help you run that math honestly.',
      },
      {
        question: 'Do older Boise homes have surprises behind the walls?',
        answer:
          'Pre-1990 homes, especially in the North End and on the Bench, often reveal wiring, plumbing, or framing conditions once drywall opens. We recommend holding a 10 to 15 percent contingency and we flag known risk areas during design.',
      },
    ],
    costGuidance: {
      heading: 'Whole-home remodel cost in the Treasure Valley',
      paragraphs: [
        'As of 2026, whole-home remodels in the Boise area commonly plan $150,000 to $400,000 or more, driven by square footage, structural and layout changes, and finish level. Per-square-foot planning shorthand runs roughly $60 to $150+ depending on scope depth.',
        'These are planning ranges, not bids. A written master scope after your free in-home visit defines the real number, and phasing options can spread the investment across stages.',
      ],
    },
  },
  'adu': {
    slug: 'adu',
    name: 'ADU / Guest House',
    headline: 'ADU & Guest House Construction in the Treasure Valley',
    primaryKeyword: 'adu construction boise idaho',
    overview:
      'Accessory dwelling units add livable square footage, rental income potential, and long-term property value without leaving your lot. Boise Remodeling Co designs and builds detached and attached ADUs with full permit handling, structural planning, and interior finishes under one accountable design-build team.',
    benefits: [
      'Single team from design through certificate of occupancy, no coordinating separate trades',
      'Ada and Canyon County ADU permitting and setback requirements handled in-house',
      'Rental-ready finish packages designed for durability and appeal',
      'Exterior materials and rooflines planned to complement your existing home',
    ],
    inclusions: [
      'Site feasibility evaluation and setback review',
      'Foundation, framing, and structural engineering',
      'Plumbing, electrical, and HVAC for a fully self-contained unit',
      'Kitchen and bath fit-out with finish selections guidance',
      'Permit coordination and final inspection through certificate of occupancy',
    ],
    timeline: 'Most ADU projects run 4 to 7 months from design through certificate of occupancy, depending on unit size, site conditions, and permit timelines.',
    processSteps: [
      { title: 'Site visit and feasibility', description: 'We review your lot, setbacks, utility access, and HOA rules to confirm the ADU approach that works best.' },
      { title: 'Design and engineering', description: 'Plans are drawn to meet code, match your property, and maximize livability within your investment target.' },
      { title: 'Permitting and construction', description: 'We file permits and manage every trade from foundation through finish with weekly written updates.' },
      { title: 'Inspections and closeout', description: 'Final inspections are coordinated and we walk through every detail before handoff.' },
    ],
    faqs: [
      {
        question: 'How much does an ADU cost in the Treasure Valley?',
        answer:
          'ADU investment typically ranges from $120,000 to $350,000 depending on size, detached or attached configuration, and finish level. Use our project estimator for a planning range, then schedule a free in-home visit for a written scope.',
      },
      {
        question: 'Do I need a permit for an ADU in Boise or Ada County?',
        answer:
          'Yes. ADUs require permits in all Treasure Valley jurisdictions. Requirements vary by city and lot. We handle permitting as part of our design-build scope and are current on local ADU ordinances.',
      },
      {
        question: 'Can an ADU be rented out as a long-term or short-term rental?',
        answer:
          'In many cases yes, subject to local zoning and HOA rules. We can discuss what your city allows during your consultation so you can plan your unit accordingly.',
      },
      {
        question: 'How big can an ADU be in Boise?',
        answer:
          'Boise generally allows ADUs up to 900 square feet under its current zoning code, though setbacks and lot coverage on your specific lot often set the practical limit. We confirm the buildable envelope during feasibility.',
      },
      {
        question: 'Is a garage conversion cheaper than building a detached ADU?',
        answer:
          'Usually yes. Garage conversions reuse the existing foundation and shell, typically planning $90,000 to $180,000, versus $180,000 to $300,000+ for a detached new build. The tradeoff is losing garage storage and parking.',
      },
      {
        question: 'Does an ADU need separate utilities?',
        answer:
          'It depends on the city and design. Many units share the main house\'s water and sewer with properly sized lines; electrical usually needs a panel evaluation. We resolve the utility strategy during design, before pricing is final.',
      },
      {
        question: 'How long does an ADU take to build?',
        answer:
          'Plan 4 to 7 months from design through certificate of occupancy: 6 to 10 weeks of design and engineering, plan review that varies by jurisdiction, then 3 to 5 months of construction for a detached unit.',
      },
      {
        question: 'Will an ADU increase my property value?',
        answer:
          'A permitted ADU adds appraisable square footage and rental income potential that Treasure Valley buyers increasingly search for. Unpermitted units do the opposite, creating disclosure and insurance problems at sale.',
      },
    ],
    costGuidance: {
      heading: 'ADU cost in the Treasure Valley',
      paragraphs: [
        'As of 2026, garage conversions in the Boise area typically plan $90,000 to $180,000. Attached ADUs and basement conversions plan $120,000 to $250,000, and detached new-build ADUs plan $180,000 to $300,000 or more depending on size, utility connections, and finish level.',
        'These are planning ranges, not bids. Site conditions and utility strategy drive ADU budgets more than any other project type, which is why feasibility review comes first in our process.',
      ],
    },
  },
  'room-addition': {
    slug: 'room-addition',
    name: 'Room Addition',
    headline: 'Home Additions in the Treasure Valley',
    primaryKeyword: 'home additions boise idaho',
    overview:
      'Room additions expand living space without moving. We design attached additions, in-law suites, and bonus rooms that match your roof lines, foundation, and interior architecture, with permits and structural scope handled professionally.',
    benefits: [
      'Structural and architectural planning before breaking ground',
      'Exterior materials matched to your existing home',
      'Clear permit path for Ada and Canyon County',
      'Integrated HVAC and electrical planning',
    ],
    inclusions: [
      'Feasibility and site evaluation',
      'Foundation and framing',
      'Roof tie-in and exterior finish',
      'Interior finish to match existing home',
      'Permit and inspection coordination',
    ],
    timeline: 'Additions vary widely; many projects run 3 to 5 months from design through certificate of occupancy.',
    processSteps: [
      { title: 'Site visit', description: 'We review setbacks, access, and structural implications.' },
      { title: 'Design and engineering', description: 'Plans address code, loads, and aesthetic match.' },
      { title: 'Construction', description: 'Foundation through finish with weekly communication.' },
      { title: 'Inspections and closeout', description: 'We coordinate final inspections and walkthrough.' },
    ],
    faqs: [
      {
        question: 'Do I need a permit for a room addition in Idaho?',
        answer: 'Yes. Additions require permits in Ada and Canyon County. We handle permitting as part of our scope.',
      },
      {
        question: 'Will an addition match my existing home?',
        answer: 'That is a core part of our design process, roof lines, siding, and interior trim are planned to blend, not bolt on.',
      },
      {
        question: 'How do additions affect property taxes?',
        answer: 'Added square footage may affect assessed value. We can discuss timing and scope during planning; consult your tax advisor for specifics.',
      },
      {
        question: 'How much does a room addition cost in Boise?',
        answer:
          'Most Treasure Valley additions plan $80,000 to $250,000 or more depending on size, foundation work, and whether bathrooms or kitchens are included. Second-story additions trend higher due to structural scope.',
      },
      {
        question: 'How long does a room addition take?',
        answer:
          'Many additions run 3 to 5 months of construction after design and permits. Engineering and plan review add 6 to 12 weeks up front, and HOA design review in communities like Eagle can add more.',
      },
      {
        question: 'Is a second-story addition possible on my home?',
        answer:
          'It depends on your foundation and framing capacity, which an engineer evaluates during feasibility. When the structure allows it, building up preserves yard space that Treasure Valley lots often cannot spare.',
      },
      {
        question: 'Can I stay in my home during an addition?',
        answer:
          'Usually yes. Most of the work happens outside the existing envelope until tie-in, and we sequence the breakthrough phase to minimize the days your living space is open.',
      },
      {
        question: 'Addition or ADU - which adds more value?',
        answer:
          'An addition grows your main living space; an ADU creates a separate rentable unit. If income potential matters, compare both paths - we build each and will price your lot honestly in either direction.',
      },
    ],
    costGuidance: {
      heading: 'Room addition cost in the Treasure Valley',
      paragraphs: [
        'As of 2026, room additions in the Boise area commonly plan $80,000 to $250,000 or more. Single-room bump-outs sit at the lower end; primary suite additions with bathrooms and second-story additions with structural upgrades reach the upper end.',
        'These are planning ranges, not bids. Foundation, roof tie-in, and whether plumbing is included drive addition budgets, which we confirm in a written scope after your free in-home visit.',
      ],
    },
  },
};

export function getAreaIntro(city: CityData): string {
  const county = getCountyLabel(city.county);
  const neighborhood = ''; // filled from CITY_SEO_DATA at runtime in pages
  return `Boise Remodeling Co provides design-build remodeling for homeowners in ${city.name}, Idaho and throughout ${county}. From kitchen and bathroom renovations to whole-home remodels and room additions, you work with one accountable team from consultation through final walkthrough.`;
}

export function getCityServiceIntro(
  service: ServiceSEOContent,
  city: CityData,
  localFact?: string,
): string {
  const county = getCountyLabel(city.county);
  const fact = localFact
    ? ` ${localFact}`
    : ` We understand ${county} permit requirements and typical ${city.name} home styles.`;
  return `Looking for ${service.name.toLowerCase()} in ${city.name}, Idaho?${fact} Boise Remodeling Co offers design-build ${service.name.toLowerCase()} with clear written scope, proactive weekly updates, and a written workmanship guarantee. Schedule a free in-home consultation or use our project estimator for a planning range.`;
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
            question: `How much does a ${service.name.toLowerCase()} cost in ${city.name}?`,
            answer: `${city.name} pricing tracks the broader Treasure Valley market. ${costSentence} Schedule a free in-home visit for a written scope specific to your home.`,
          },
        ]
      : []),
    ...service.faqs.slice(0, 2),
    {
      question: `Do you offer ${service.name.toLowerCase()} in ${city.name}?`,
      answer: `Yes. We regularly serve ${city.name} and surrounding ${county} neighborhoods with ${service.name.toLowerCase()} projects.`,
    },
    {
      question: `How do I get a quote for ${service.name.toLowerCase()} in ${city.name}?`,
      answer: `Use our online project estimator for a planning range, then book a free 60 to 90 minute in-home visit. We will leave you with design direction and clear next steps.`,
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
                label: 'Boise Remodeling Cost Guide',
                href: '/guides/boise-remodeling-cost-guide',
              },
            ],
          },
        ]
      : []),
    {
      heading: `${service.name} across ${city.name} neighborhoods`,
      paragraphs: [
        neighborhoods.length
          ? `We design and build ${serviceLC} projects throughout ${city.name}, including ${neighborhoods.join(', ')}. Housing stock varies between these neighborhoods, so we tailor layouts, structural details, and finish selections to the age and style of your specific ${city.name} home.`
          : `We design and build ${serviceLC} projects throughout ${city.name}, tailoring layouts, structural details, and finishes to the age and style of your specific home.`,
        landmarks.length
          ? `As a local team familiar with ${city.name} landmarks like ${landmarks.slice(0, 3).join(', ')}, we understand the character of the area and plan ${serviceLC} work that fits the neighborhood and protects resale value.`
          : `As a local team, we plan ${serviceLC} work that fits the neighborhood and protects resale value.`,
      ],
    },
    {
      heading: `${service.name} permits and planning in ${county}`,
      paragraphs: [
        `${service.name} projects in ${city.name} that change layout, structure, plumbing, or electrical require permits through ${county}. We build plan review and inspection timelines into your schedule from day one and handle submissions, fees, and inspections as part of the design-build contract.`,
        seo?.climate
          ? `Our ${city.name} ${serviceLC} designs also account for the local ${seo.climate} - from insulation and ventilation choices to materials that hold up to Treasure Valley freeze-thaw cycles.`
          : `Our ${city.name} ${serviceLC} designs account for the local Treasure Valley climate, including durable materials and proper insulation.`,
      ],
      links: [
        { label: `${city.name} remodeling contractor overview`, href: `/areas/${city.slug}` },
        { label: 'Ada vs Canyon County permit timelines', href: '/resources/ada-canyon-permit-flow' },
      ],
    },
  ];

  return sections;
}

export const AREA_PAGE_FAQS: FAQItem[] = [
  {
    question: 'What remodeling services do you offer?',
    answer:
      'Kitchen remodels, bathroom remodels, whole-home renovations, and room additions, all managed design-build with one team.',
  },
  {
    question: 'Are you licensed and insured?',
    answer:
      'Yes. Boise Remodeling Co is licensed, bonded, and insured. Idaho contractor license details available upon request.',
  },
  {
    question: 'How do I start a project?',
    answer:
      'Call us, use our project estimator, or schedule a free in-home consultation through our website.',
  },
];

export const HOMEPAGE_FAQS_FOR_SCHEMA: FAQItem[] = [
  {
    question: 'How are you different from other remodeling companies in the Treasure Valley?',
    answer:
      'We operate as a true design-build firm with one accountable team from first visit to final walkthrough, not separate designers and contractors you have to coordinate.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, and the greater Treasure Valley.',
  },
  {
    question: 'Do you handle permits?',
    answer: 'Yes. Permits are included in our scope and handled in-house for Ada and Canyon County.',
  },
  {
    question: 'What is your workmanship guarantee?',
    answer: 'We provide a written workmanship guarantee on our labor.',
  },
];
