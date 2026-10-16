import type { FAQItem } from '../seoContent';

/**
 * Per-city /areas copy for the seven Treasure Valley pages in this batch.
 * Other cities keep the shared intro template and AREA_PAGE_FAQS.
 * Visible FAQ text and FAQPage schema both read these arrays.
 */
export interface AreaCityCopy {
  intro: string;
  faqs: FAQItem[];
}

const AREA_CITY_COPY: Record<string, AreaCityCopy> = {
  boise: {
    intro:
      'Building new in Boise usually means working with what is already there. Census estimates for 2020–2024 put the median Boise home at 1986 vintage, and about 64% of the city\'s housing is detached single-family, so many projects here are infill lots or additions to established houses. Boise Construction Co handles design, engineering, permitting with the city, and construction under one design-build contract, with a written line-item scope before the foundation is poured.',
    faqs: [
      {
        question: 'What kinds of homes do you build?',
        answer:
          'Four kinds of new-home work: blank-page custom homes, semi-custom homes adapted from an existing plan, builds on a lot you already own, and shop homes. Design and lot evaluation can also be hired on their own, which helps on Boise infill parcels where setbacks and utilities need checking before anyone commits to a plan.',
      },
      {
        question: 'Are you licensed and insured?',
        answer:
          'Yes. We\'re licensed, bonded, and insured, and our Idaho contractor registration details are yours on request. That matters here: the City of Boise homeowner guide says anyone other than the owner who performs permitted trade work must be registered and licensed with the State of Idaho.',
      },
      {
        question: 'How do I start a project?',
        answer:
          'Three ways: call (208) 477-1169, get a planning range from our construction estimator, or book the free planning consultation on our website. Have the Boise address handy, because the parcel gets reviewed for setbacks, utilities, soil, and slope before we price the home.',
      },
      {
        question: 'Do you build in Boise, Idaho?',
        answer:
          'Yes. Boise is inside our Treasure Valley service area, from the North End to the Bench. Custom, semi-custom, and build-on-your-lot homes are all available here, and we\'ll evaluate a Boise lot for you before purchase. Our Harris Ranch and Hidden Springs guides cover two planned communities on the Boise side of the valley.',
      },
      {
        question: 'Which county is Boise in?',
        answer:
          'Ada County. Inside city limits, permits run through the City of Boise\'s Planning and Development Services; property outside city limits follows the Ada County process. Our Ada and Canyon County permit-flow page compares how the two counties handle it.',
      },
      {
        question: 'What does Boise require before a new home breaks ground?',
        answer:
          'A building permit and the trade permits, plus an erosion and sediment control (ESC) permit for any new one- or two-family dwelling. Boise\'s homeowner guide also sets frost depth at 24 inches minimum below grade where a foundation to frost depth is required. We confirm those submissions and inspections for your scope and account for them in the schedule.',
      },
      {
        question: 'Does an older Boise house change how an addition is planned?',
        answer:
          'Often. About 42% of Boise homes were built before 1980 (Census ACS 2020–2024), and an addition has to tie into the existing framing, the existing utilities, and the way the household already lives. In a Boise historic district, windows, siding, and similar exterior work also need a Certificate of Appropriateness from Planning before the building permit, per the city\'s homeowner guide.',
      },
    ],
  },
  meridian: {
    intro:
      'Meridian is one of the newest housing markets we work in. The Census Bureau\'s 2020–2024 estimates put the city\'s median home at 2007, and close to 82% of homes are detached single-family houses. Boise Construction Co, a service-area builder based in Meridian, plans and builds custom and semi-custom homes here with one accountable design-build team, from lot review and design through the city permit and the final walkthrough.',
    faqs: [
      {
        question: 'What kinds of homes do you build?',
        answer:
          'Here in Meridian, where we\'re based, the menu is fully custom, semi-custom from an adapted plan, build-on-your-lot, and shop homes. Still deciding? Our design service and our lot evaluation can each be booked separately, before you commit to a full build.',
      },
      {
        question: 'Are you licensed and insured?',
        answer:
          'Yes on all three counts: licensed, bonded, insured. Ask any time for our Idaho contractor registration details. Permitting sits inside our design-build scope, which matters in Meridian: the city fee schedule sets double permit fees as the minimum charge when work starts without a permit.',
      },
      {
        question: 'How do I start a project?',
        answer:
          'Phone us, try the estimator for a ballpark planning range, or set up a free planning consultation online. Estimator ranges are planning estimates, not quotes; a firm proposal for a Meridian home follows a site visit and a lot review.',
      },
      {
        question: 'Do you build in Meridian, Idaho?',
        answer:
          'Yes. Meridian sits squarely in our Treasure Valley service area, Lochsa Falls and Tuscany included. We build every home type we offer in town, custom, semi-custom, or on your own land, and a lot review before you buy means soils, access, and utilities are known up front.',
      },
      {
        question: 'Which county is Meridian in?',
        answer:
          'Meridian lies entirely in Ada County. The city\'s Building Services division (33 E. Broadway Ave.) handles structural, electrical, mechanical, plumbing, and fire permits inside city limits, with applications filed online through the Citizen Access portal. For the Ada-versus-Canyon comparison, see our permit-flow page.',
      },
      {
        question: 'What city fees belong in a Meridian new-home budget?',
        answer:
          'Meridian\'s published fee schedule lists a $150 non-refundable application fee for new residential projects, applied to the building permit, and a permit fee of $50 plus $5.50 per $1,000 of project value. Impact fees scale with climate-controlled floor area; for a 1,701–2,500 sq ft home the schedule shows $995 fire, $4,119 parks, and $402 police. Confirm current amounts with the city before you budget.',
      },
      {
        question: 'How deep do foundations go in Meridian?',
        answer:
          'Meridian\'s handout for detached accessory buildings calls for footings to the frost line, 24 inches deep, on sheds over 600 sq ft or with power and heat. A new house foundation is engineered for that frost depth and for the soil on your particular lot, which is one reason the lot review comes before final pricing.',
      },
    ],
  },
  nampa: {
    intro:
      'Nampa mixes older and newer housing more than most Treasure Valley cities. Census figures for 2020–2024 show about 26% of its homes built before 1980 and roughly 22% built since 2010. We build new homes across Nampa and Canyon County, from fully custom designs to houses on land you already own, and one team carries each project from drawings to keys.',
    faqs: [
      {
        question: 'What kinds of homes do you build?',
        answer:
          'Nampa clients come to us for fully custom homes, for semi-custom houses based on proven plans we adapt, for construction on property they already hold, and for shop homes. Lot evaluation and design work are sold as separate services too, useful when a Canyon County parcel needs a feasibility check first.',
      },
      {
        question: 'Are you licensed and insured?',
        answer:
          'Licensed, bonded, and insured, yes. Want our Idaho contractor registration details? Just ask. Nampa\'s residential FAQ says that when a homeowner isn\'t doing the work, a State of Idaho registered building contractor or licensed trade sub-contractor must pull the permit and perform it.',
      },
      {
        question: 'How do I start a project?',
        answer:
          'Pick whichever is easiest: a phone call, a planning range from the build estimator, or a free consultation scheduled through our site. Our free in-home visit runs 60 to 90 minutes and covers planning guidance and design direction, with no obligation.',
      },
      {
        question: 'Do you build in Nampa, Idaho?',
        answer:
          'Yes, Nampa is one of the Treasure Valley cities we serve, Downtown Nampa and Karcher among them. Whether it\'s a custom home, a semi-custom plan, or a house on your property, we build it here, and a Nampa lot can be evaluated before purchase so soil, access, and utility questions are answered early.',
      },
      {
        question: 'Which county is Nampa in?',
        answer:
          'Canyon County. Within city limits, Nampa Development Services at 500 12th Ave S reviews building permits; unincorporated parcels go through the county instead. A side-by-side of the Canyon and Ada steps is on our permit-flow page.',
      },
      {
        question: 'Which Nampa projects need a building permit?',
        answer:
          'Nampa\'s residential FAQ lists new one- and two-family dwellings, finishing an attic, garage, or basement, decks more than 12 inches high, re-roofing, siding or stucco replacement, and detached sheds over 200 sq ft, or of any size if hardwired for 120 V. Residential fences need a separate $10 Planning and Zoning fence permit.',
      },
      {
        question: 'How does Nampa\'s climate shape a new home?',
        answer:
          'NOAA\'s 1991–2020 normals for the Nampa Sugar Factory station show about 11 inches of precipitation a year, roughly 59 days at 90°F or hotter, and 132 nights at or below freezing. That mix of heat and frost is why our Nampa designs pay close attention to insulation levels, window specification, and an envelope built for freeze-thaw cycles.',
      },
    ],
  },
  eagle: {
    intro:
      'Eagle homeowners tend to build for the long haul: 84% of occupied homes in the city are owner-occupied, and 43% of its housing has gone up since 2010, per Census ACS 2020–2024. Boise Construction Co designs and builds custom homes, semi-custom homes, and shop homes in Eagle, including foothills parcels where slope and access drive the budget, keeping design, permits, and construction under a single contract.',
    faqs: [
      {
        question: 'What kinds of homes do you build?',
        answer:
          'Custom homes drawn from scratch, semi-custom homes from adapted plans, houses built on the Eagle land you already own, and shop homes. Weighing a foothills parcel? Our design and lot evaluation services stand alone, so you can hire either before deciding.',
      },
      {
        question: 'Are you licensed and insured?',
        answer:
          'We are. The company is licensed, bonded, and insured, and we\'ll share Idaho contractor registration details with any Eagle homeowner who requests them.',
      },
      {
        question: 'How do I start a project?',
        answer:
          'Start with a call, a planning range from the online estimator, or a free planning consultation you book on our website. If your Eagle lot is on a slope, read our Eagle Foothills building guide first; sloped sites and shared wells change the numbers.',
      },
      {
        question: 'Do you build in Eagle, Idaho?',
        answer:
          'Yes. Eagle falls within our Treasure Valley service area, from Banbury to Floating Feather. Custom and semi-custom homes, plus builds on land you own, are all on offer, and an Eagle lot can be assessed before you sign for it.',
      },
      {
        question: 'Which county is Eagle in?',
        answer:
          'Ada County. Eagle\'s Building Division handles permits for property within city limits, and the permit-flow page on our site walks through how that path differs from Canyon County\'s.',
      },
      {
        question: 'How long does Eagle plan review take for a new home?',
        answer:
          'As of October 2026 the City of Eagle Building Division posts a plan review turnaround of about 6 weeks for single-family homes, detached garages and shops, and additions, assuming no revisions. Revisions extend it, so we aim for a complete, permit-ready drawing set and build the review window into the schedule.',
      },
      {
        question: 'Can I build a shop home or post-frame building in Eagle?',
        answer:
          'The City of Eagle publishes separate submittal requirements for pole barn and post-frame buildings, alongside its 2018 IRC residential code. Shop homes and barndominiums are one of our services, and setbacks and site rules for your specific Eagle parcel are checked during lot evaluation, before design starts.',
      },
    ],
  },
  kuna: {
    intro:
      'Kuna is overwhelmingly a single-family town: 92% of its homes are detached houses, and the median home dates to 2008, based on Census ACS 2020–2024 estimates. Our design-build team takes Kuna clients through it, whether that means a fully custom design, a personalized semi-custom plan, or a house on land you already own, with one accountable contact from feasibility to keys.',
    faqs: [
      {
        question: 'What kinds of homes do you build?',
        answer:
          'In Kuna that means a fully custom home, a semi-custom plan we adapt to you, a home on a lot you own, or a shop home, including post-frame and steel-framed designs that pair living space with real shop square footage. Design and lot evaluation are also offered by themselves.',
      },
      {
        question: 'Are you licensed and insured?',
        answer:
          'Yes, fully licensed, bonded and insured. Before a Kuna project begins you can request our Idaho contractor registration details and we\'ll send them.',
      },
      {
        question: 'How do I start a project?',
        answer:
          'Give us a ring, run the construction estimator to see a rough planning range, or reserve a free planning consultation on the site. Kuna\'s building department processes residential applications in the order received, so a complete plan set keeps a project moving.',
      },
      {
        question: 'Do you build in Kuna, Idaho?',
        answer:
          'We do. Kuna is in our Treasure Valley coverage, including Black Cat and Crimson Point. Expect the full range here (custom, semi-custom, or your own lot), and ask us to look at a Kuna parcel before you close on it.',
      },
      {
        question: 'Which county is Kuna in?',
        answer:
          'Kuna belongs to Ada County. Inside city limits, permits come from the Kuna Building Department at 751 W 4th Street, and parcels outside follow the county. Our permit-flow resource compares Ada and Canyon processes.',
      },
      {
        question: 'What does a Kuna building permit cost?',
        answer:
          'Kuna\'s Building Department fee schedule lists a $70 residential submittal fee and structural plan review at $65 per hour with a one-hour minimum. The permit fee then scales with project value; for example, $1,461 covers the first $250,001, plus $4.85 for each additional $1,000 up to $500,000. Plumbing, mechanical, and impact fees are separate.',
      },
      {
        question: 'What does Kuna ask for in a new-home submittal?',
        answer:
          'Kuna\'s digital submittal instructions call for the application, site plan, floor plan, a Manual J load calculation, ResCheck if the home isn\'t using the prescriptive energy path, and any structural calculations. The approved plans, Manual J, and calcs then have to be on site during construction.',
      },
    ],
  },
  caldwell: {
    intro:
      'Caldwell\'s housing covers a wide span of eras, with roughly 29% of homes built before 1980 and about 32% since 2010 (Census ACS 2020–2024). Boise Construction Co builds new homes for Caldwell and Canyon County clients, from blank-page custom designs to semi-custom plans and homes on your own land, and every Caldwell build starts from a written, line-item scope.',
    faqs: [
      {
        question: 'What kinds of homes do you build?',
        answer:
          'Caldwell projects can be fully custom homes, semi-custom homes adapted from a plan, houses on property you hold, or shop homes. We also take on design or lot evaluation by itself, which suits Caldwell parcels outside a platted subdivision that need extra review.',
      },
      {
        question: 'Are you licensed and insured?',
        answer:
          'Yes: licensed, bonded, and insured. Our registration details from the State of Idaho are available on request, and Caldwell\'s permit packet includes a contractor registration declaration under Idaho Code 54-5209, so that number appears on the permit.',
      },
      {
        question: 'How do I start a project?',
        answer:
          'Call, check the estimator\'s planning range, or request a free planning consultation through the website. Whichever route you take, a Caldwell build gets a line-item budget before we break ground.',
      },
      {
        question: 'Do you build in Caldwell, Idaho?',
        answer:
          'Yes. Caldwell is covered by our Treasure Valley service area, Cleveland Blvd and Ustick included. We\'ll build a custom or semi-custom home or a house on land you already have, and we can review a Caldwell lot ahead of your purchase.',
      },
      {
        question: 'Which county is Caldwell in?',
        answer:
          'Caldwell is a Canyon County city. Its Department of Building Safety (205 S. 6th Ave.) issues permits inside city limits. To see how the Canyon County and Ada County paths differ, use our permit-flow comparison.',
      },
      {
        question: 'How long does Caldwell plan review take?',
        answer:
          'Caldwell\'s residential permit packet estimates plan review at no more than 5 to 7 working days for a complete set of plans and supporting documents. Parcels that aren\'t part of a platted subdivision take longer, and projects in a designated flood plain need a flood plain certificate.',
      },
      {
        question: 'How are Caldwell building permit fees calculated?',
        answer:
          'Under the city\'s FY2026 schedule (Resolution 300-25), the permit fee comes from total project valuation: for example, $846.27 plus about 0.45% of value above $100,000 in the $100,000–$499,999 range. Residential plan review adds 40% of the permit fee, Planning and Zoning review 35% (minimum $55), and engineering review 20%.',
      },
    ],
  },
  star: {
    intro:
      'Star is the newest city on our service map: its median home was built in 2011, and about 22% of homes date from 2020 or later, according to Census ACS 2020–2024 estimates. In Star we build custom and semi-custom homes and houses on clients\' own land, planned by one design-build team covering design, engineering, the city permit, and construction.',
    faqs: [
      {
        question: 'What kinds of homes do you build?',
        answer:
          'Any of our four home types: custom from a blank page, semi-custom starting from an adapted plan, a build on land you own, or a shop home. Want a Star parcel checked before committing? Design and lot evaluation are each available without a full build contract.',
      },
      {
        question: 'Are you licensed and insured?',
        answer:
          'Yes. Licensed, bonded, insured: we carry all three, and we provide our Idaho contractor registration details when asked. Star\'s building FAQ notes that contractors need a current, valid State of Idaho license to apply for permits in the city.',
      },
      {
        question: 'How do I start a project?',
        answer:
          'Ring (208) 477-1169, see a planning range in the construction estimator, or schedule the free consultation through our website. If operating costs are a priority, ask about our energy-efficient homes, which are verified by blower-door testing.',
      },
      {
        question: 'Do you build in Star, Idaho?',
        answer:
          'Absolutely. Star belongs to our Treasure Valley service area, with Star River Ranch and Star Crossing among its neighborhoods. Every home type we build is available here, from custom and semi-custom to a house on your own lot, and evaluating a Star lot before you buy is part of what we offer.',
      },
      {
        question: 'Which county is Star in?',
        answer:
          'Star is in Ada County, though Census boundary data shows part of the city extends into Canyon County, so confirm which county your parcel sits in. Within city limits, Star\'s Building Department issues permits, and our permit-flow page lays out both counties\' steps.',
      },
      {
        question: 'Does Star require anything extra for a home with a basement?',
        answer:
          'Yes. Star\'s residential submittal checklist (February 2026) requires a soils and geotechnical report, stamped and signed by an Idaho licensed engineer, for projects that include a basement. New homes also need a sewer certificate from Star Sewer & Water unless the home is on septic.',
      },
      {
        question: 'When does the fire department review a Star home?',
        answer:
          'Star\'s checklist sends any structure or group of structures totaling 4,000 sq ft or more to Fire, which checks whether hydrant flow to the property is adequate and may require alternatives if it isn\'t. Larger custom homes and shop-home combinations should plan for that review.',
      },
    ],
  },
};

export function getAreaCityCopy(slug: string): AreaCityCopy | undefined {
  return AREA_CITY_COPY[slug];
}
