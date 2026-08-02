/** Hub-specific FAQs - substantive answers, not generic templates. */

export function getHubPillarFaqs(hubSlug: string): Array<{ question: string; answer: string }> {
  const faqs: Record<string, Array<{ question: string; answer: string }>> = {
    'home-building-costs': [
      {
        question: 'How much does it cost to build a house in Boise?',
        answer:
          'A custom home in the Treasure Valley plans at $250 to $400 per finished square foot in 2026, excluding land. At 2,400 square feet that is roughly $600,000 to $960,000. A semi-custom home runs $225 to $300 per finished square foot, or about $450,000 to $600,000 at 2,000 square feet. A simple single-level on a flat valley lot can come in near $225 per square foot, while a steep foothills site with a high level of detail regularly exceeds $450.',
      },
      {
        question: 'Does the per square foot price include the land?',
        answer:
          'No. Every figure we publish excludes land, and it also excludes site work, which is quoted separately because it varies enormously. A serviced subdivision lot typically carries $25,000 to $50,000 of site work. A rural parcel needing a well, a septic system, and sometimes access or a power extension commonly runs $80,000 to $150,000 before a foundation is poured. Buying land and building on it are two budgets, and confusing them is the most common budgeting mistake we see.',
      },
      {
        question: 'What does design and engineering cost on a new home?',
        answer:
          'Design and engineering commonly run 5 to 12 percent of construction cost, which is roughly $9,000 to $35,000 on a typical Treasure Valley house. The range is wide because a proven plan adapted to a flat lot needs far less drafting and structural work than an original design on a sloped foothills site with a geotechnical report, engineered foundations, and retaining. A written lot evaluation, if you want one before you buy, is $950 to $3,500.',
      },
      {
        question: 'Why do two builders quote such different prices for the same house?',
        answer:
          'Usually because the two bids do not cover the same work. The most common differences are allowances set low to win the bid, site work excluded or guessed at, and items like the driveway, landscaping, fencing, and window coverings left out of one bid and included in the other. Before comparing totals, line the two up item by item and ask each builder in writing what is excluded. A short bid is not a cheap house, it is a later invoice.',
      },
      {
        question: 'Is a semi-custom home actually cheaper than a custom home?',
        answer:
          'Yes, usually by $25 to $100 per finished square foot: $225 to $300 for semi-custom against $250 to $400 for custom. The saving comes from a plan that has already been drawn, engineered, and built, so there is less design time, less structural work, and fewer one-off details for trades to solve on site. The trade-off is real. If your lot or the way you live needs something the plan does not do, modifying a semi-custom plan far enough erases the saving.',
      },
      {
        question: 'How much does a shop home or barndominium cost in Idaho?',
        answer:
          'Plan on $150 to $250 per square foot blended across the living space and the shop, because a finished shop costs far less per square foot than finished living area. A 1,600 square foot living space with a 1,200 square foot attached shop commonly lands between $265,000 and $500,000, excluding land. The blend is what makes these attractive on acreage, but the living portion is still built and priced like a house.',
      },
      {
        question: 'What does a high-performance or energy-efficient home add?',
        answer:
          'A high-performance home plans at $275 to $425 per finished square foot, and the upgrades over code minimum typically add 3 to 8 percent of construction cost, roughly $20,000 to $55,000. That covers better air sealing, more insulation, better windows, and mechanical equipment sized to the tighter envelope. Whether it pays back depends on how long you plan to stay. If you are selling in three years, the comfort is real but the arithmetic rarely works.',
      },
    ],
    'choosing-a-builder': [
      {
        question: 'How do I compare home builder bids fairly?',
        answer:
          'Compare scope before you compare price. Put the bids side by side and check that each one carries the same site work, the same allowances for cabinets, flooring, tile, plumbing fixtures, and lighting, and the same treatment of the driveway, landscaping, fencing, and utility connections. Ask every builder for a written list of exclusions. Once the scopes match, the price difference is meaningful. Until then you are comparing two different houses that happen to share a floor plan.',
      },
      {
        question: 'What should I ask a builder before signing anything?',
        answer:
          'Ask how allowances were set and whether they reflect what those items actually cost here. Ask who your single point of contact is and how often you will hear from them in writing. Ask for the draw schedule, the change order process, and the warranty terms in writing. Ask what happens if the site turns up something unexpected. Finally, ask what they would not build, because a builder who says yes to everything has not thought about your project.',
      },
      {
        question: 'Are home builders licensed in Idaho?',
        answer:
          'Idaho registers residential contractors rather than licensing them, so a builder who advertises being licensed is using the word loosely. What you should verify is that the builder is registered with the state, carries general liability insurance and workers compensation, and is bonded. Ask for the certificates directly from the insurer rather than a copy, and confirm coverage is current for the dates you will be building. We provide our registration and certificates on request.',
      },
      {
        question: 'Is design-build better than hiring an architect and a builder separately?',
        answer:
          'Design-build puts drawing and building under one contract, so the plan gets priced as it is drawn and there is nobody to point at when the design comes in over budget. That is the main reason people choose it. The honest counterargument is that a separate architect gives you an independent advocate and generally more design ambition. If your project is architecturally driven and your budget has room, that path is legitimate. For most Treasure Valley houses, design-build costs less and takes less time.',
      },
      {
        question: 'Fixed price or cost plus: which should I choose?',
        answer:
          'Fixed price puts the risk on the builder and gives you a number you can take to a lender, but it only works when the scope is fully defined, and anything undefined gets priced with a cushion. Cost plus is transparent and fair when the scope genuinely cannot be pinned down, such as a difficult site, but your final number is not known until the end. For a defined new home on a known lot, a fixed price with clear allowances is usually the better deal.',
      },
      {
        question: 'What are the red flags when hiring a home builder?',
        answer:
          'A large deposit demanded before any drawing exists. Verbal scope with nothing written. Allowances that are obviously below local prices, which guarantees change orders later. No published draw schedule. Reluctance to name who handles permits and inspections. And a bid that arrives well under every other bid without an explanation you can follow. Low bids are usually short scope, and the difference shows up as change orders once you are committed and moving is no longer an option.',
      },
      {
        question: 'How should payments be structured during a build?',
        answer:
          'Payments should follow a published draw schedule tied to completed stages of work rather than to the calendar, so what you have paid for roughly matches what has been built. If a construction loan is funding the project, the lender will inspect before releasing each draw, which is a useful independent check. Get the schedule in writing before you sign, and make sure the final payment is meaningful enough that finishing the punch list matters to the builder.',
      },
    ],
    'home-building-process': [
      {
        question: 'How long does it take to build a house in the Treasure Valley?',
        answer:
          'Plan on the better part of a year from first drawing to keys, and longer if the site is complicated. Design and selections usually take a few months, permitting and plan review add more, and construction itself commonly runs several months beyond that. Weather, a rural site needing a well and septic, and long-lead items such as windows and cabinets are the usual reasons a schedule stretches. Anyone promising a firm date before the plan is drawn is guessing.',
      },
      {
        question: 'What are the stages of building a house, in order?',
        answer:
          'Feasibility and lot review, then design and engineering, then a line-item budget, then permits and plan review. Construction starts with site work and the foundation, then framing, roof, and windows to get the house dry, then rough-in for plumbing, electrical, and mechanical with inspections at each stage. After that comes insulation, drywall, trim, cabinets, tile, paint, and flooring, then fixtures and final grade, then final inspections, the walkthrough, and handover.',
      },
      {
        question: 'Who pulls the permits, me or the builder?',
        answer:
          'We do. Permits, plan review responses, engineering coordination, and utility applications are handled in-house for both Ada and Canyon County, and we schedule the inspections. That matters here because the two counties use different portals and different review cadences, so a package assembled for one is not automatically ready for the other. If a builder asks you to pull an owner-builder permit on a house they are building, treat that as a warning sign.',
      },
      {
        question: 'What happens if something unexpected is found during construction?',
        answer:
          'It gets documented and priced in writing before any work continues, and you approve it before we proceed. On new construction the surprises are almost always in the ground: soft soils, buried debris on former farm land, rock, or groundwater higher than expected. That is exactly why a geotechnical look and a proper site evaluation before design are worth the money. They convert a mid-build emergency into a line item you knew about while you could still adjust the plan.',
      },
      {
        question: 'How often will I hear from my builder during the build?',
        answer:
          'You should get a written progress update every week, and that is what we do. It covers what happened on site, what is scheduled next, what is waiting on a decision from you, and anything that has moved on the schedule. Weekly written updates matter more than they sound like they should, because most disputes on a build trace back to a decision someone assumed had been communicated. Written updates leave a record you can both check.',
      },
      {
        question: 'Can I still make changes after construction starts?',
        answer:
          'Yes, but the price of a change climbs steeply the further along you are. Moving a wall on paper costs an hour of drafting. Moving it after framing costs framing, electrical, plumbing, and drywall, plus the schedule. Moving it after drywall costs all of that twice. We lock selections and layout before framing for exactly this reason, and we would rather spend three extra weeks in design than absorb three change orders during rough-in.',
      },
      {
        question: 'What happens at the final walkthrough and what does the warranty cover?',
        answer:
          'We walk the finished house with you and write down everything that needs correcting, which becomes the punch list to be completed before final payment. You also get the manuals, warranty documents, and a run-through of how the systems work. After possession you have a one-year workmanship warranty from us, and manufacturer warranties on equipment and materials run on their own terms. Report items as you notice them rather than saving them all for month eleven.',
      },
    ],
    'land-and-lots': [
      {
        question: 'How do I know if a lot is actually buildable?',
        answer:
          'Check utilities at the property line, legal and physical access, soils, slope, easements, setbacks, floodplain, and irrigation obligations. A parcel can be for sale, priced attractively, and still be unbuildable for what you want, usually because of a drainfield that will not fit, an easement across the only good building spot, or access that a fire district will not accept. A written lot evaluation costs $950 to $3,500 and is the cheapest part of the whole project.',
      },
      {
        question: 'What does a well and septic system add to the cost?',
        answer:
          'A rural parcel that needs a well, a septic system, and sometimes a private road or a power extension commonly runs $80,000 to $150,000 before a foundation is poured, against $25,000 to $50,000 of site work on a serviced subdivision lot. Septic on a rural Ada County parcel is permitted through Central District Health and requires soil and percolation testing. Well depth is the wild card, since neighboring wells give you an indication but no guarantee.',
      },
      {
        question: 'Should I buy the land before I talk to a builder?',
        answer:
          'Talk to a builder first, or at least make the offer contingent on a feasibility review. The most expensive mistakes we see in the Treasure Valley are made at land purchase, not during construction: a parcel where the drainfield will not fit, ground that needs an engineered foundation, or access that has to be built before a truck can get in. Every one of those is knowable beforehand and none of them is fixable afterward.',
      },
      {
        question: 'What is site work and why is it quoted separately?',
        answer:
          'Site work is everything between the raw parcel and a house that can start framing: clearing, excavation, foundation prep, utility connections or a well and septic, the driveway, drainage, and final grade. It is quoted separately because it is the single most variable cost in the project. Two parcels a mile apart can differ by $100,000 in site work with identical houses on top. Any per square foot figure you see, including ours, excludes it.',
      },
      {
        question: 'What should I know about irrigation ditches and canal easements?',
        answer:
          'Much of the buildable land in Ada and Canyon County is former irrigated farmland, and it comes with laterals, delivery ditches, and irrigation district easements. You cannot build over an easement, the district has to approve any crossing or piping, and the water right attached to the parcel usually carries an obligation to keep delivery working for neighbors downstream. This shapes where the house, the driveway, and a drainfield can sit, so resolve it during the site plan.',
      },
      {
        question: 'Is a foothills lot worth the extra cost?',
        answer:
          'It depends on how much you value the view, because you pay for it twice. Slope drives foundation design, retaining, driveway grade, and access, a geotechnical report is required, and wildland-urban interface considerations affect materials and defensible space. Steep sites with a high level of detail regularly run above $450 per finished square foot against $250 to $400 on the valley floor. If the view is the reason you are building, it can be worth it. If not, the flat lot builds a bigger house.',
      },
      {
        question: 'Can you build on a lot I already own?',
        answer:
          'Yes. Vertical construction on a lot you already own plans at $225 to $400 per finished square foot depending on plan complexity and finish level, with site work added on top based on what your parcel needs. The first step is a look at the lot itself: utilities, access, soils, slope, setbacks, and any HOA or subdivision design standards that govern what can be built there. That review shapes the plan rather than the other way around.',
      },
    ],
    'home-design-and-plans': [
      {
        question: 'Do I need an architect to build a custom home?',
        answer:
          'Not always. Many Treasure Valley homes are built from a designer-drawn plan with an engineer stamping the structure, which is faster and cheaper than a full architectural commission. An architect earns their fee on genuinely difficult problems: a steep or awkward site, an unusual program, or a design where the building itself is the point. Design and engineering land at 5 to 12 percent of construction cost either way, roughly $9,000 to $35,000, with the top of the band reflecting the harder projects.',
      },
      {
        question: 'Single story or two story: which costs less to build?',
        answer:
          'A two-story house is usually cheaper per finished square foot, because a second floor stacks living space on a foundation and roof you already paid for. A single story spreads the same square footage across twice the foundation and twice the roof, and it needs a wider lot. The counterargument is livability: single-level living is what most buyers here want long term, and on many narrow subdivision lots going up is the only way to get the space anyway.',
      },
      {
        question: 'How big should we build?',
        answer:
          'Decide the budget first, then let the square footage fall out of it, because at $250 to $400 per finished square foot every additional 200 square feet costs $50,000 to $80,000. Most people are happier spending that money on better windows, a better kitchen, and a covered outdoor space than on a formal room they will walk past. Build the space you will use daily at a finish level you like, rather than a larger house finished to a level that disappoints you.',
      },
      {
        question: 'Can I bring my own plans or a plan I bought online?',
        answer:
          'Yes, with a caveat. A purchased plan almost always needs adapting: structural engineering for our snow and seismic requirements, foundation design for your actual soils, mechanical design for our climate, and adjustments for the lot orientation, setbacks, and any subdivision design standards. That adaptation is real work, so the plan you bought is a starting point rather than a finished set. We will tell you honestly whether adapting it costs less than drawing something that fits your lot properly.',
      },
      {
        question: 'What does it cost to build an energy-efficient home?',
        answer:
          'A high-performance home plans at $275 to $425 per finished square foot, and going meaningfully past code minimum typically adds 3 to 8 percent of construction cost, about $20,000 to $55,000. The money goes into air sealing, insulation, windows, and right-sized mechanical equipment. In our climate the comfort difference is noticeable in both July and January. The payback period is long enough that we would only push it if you intend to keep the house.',
      },
      {
        question: 'When do I have to choose finishes?',
        answer:
          'Structural and layout decisions have to be final before permits. Finishes that affect rough-in, such as plumbing fixture locations, shower type, appliance placement, and lighting layout, have to be settled before rough-in inspection. Everything else, including paint, hardware, and flooring, can wait but should not, because long-lead items like windows and cabinets set the schedule. We set allowances at what those items actually cost here so the selections process does not turn into a series of overruns.',
      },
      {
        question: 'Can we design a home for aging in place or multiple generations?',
        answer:
          'Yes, and doing it at design stage costs a fraction of retrofitting later. Single-level living or a main-floor primary suite, wider doorways and hallways, blocking in bathroom walls for future grab bars, a curbless shower, and a zero-step entry add very little to a new build when they are drawn in from the start. For multigenerational households, a second suite with its own bathroom and, where zoning allows, a separate entrance is the usual arrangement.',
      },
    ],
    'treasure-valley-locations': [
      {
        question: 'Which Treasure Valley cities do you build in?',
        answer:
          'We build in Boise, Meridian, Eagle, Kuna, Star, Nampa, Caldwell, and Middleton, across Ada and Canyon County. Boise, Meridian, Eagle, Kuna, and Star permit through Ada County. Nampa, Caldwell, and Middleton permit through Canyon County. We handle permits, plan review, engineering, and utility applications in-house for both, which matters because the two counties use different portals and different review cadences.',
      },
      {
        question: 'Does it cost more to build in Eagle than in Nampa?',
        answer:
          'The house does not cost much more. Labor and materials price about the same across the valley, so a custom home is $250 to $400 per finished square foot almost anywhere here. What differs is the land, the site, and the finish level people choose. Eagle has more acreage, more slope, more parcels needing a well and septic, and buyers who generally build toward the top of the band. Nampa has cheaper ground and more serviced lots, so the same budget stretches further.',
      },
      {
        question: 'What is the difference between building in Ada and Canyon County?',
        answer:
          'Different portals, different submittal expectations, and a different review cadence. The drawings themselves are largely the same, but a package assembled for an Ada submittal is not automatically ready for a Canyon one, and a builder who works only in Boise and Meridian will feel that. Canyon County also has proportionally more rural parcels, which means more well and septic permitting. We work both counties regularly and prepare each submittal the way the reviewing jurisdiction expects it.',
      },
      {
        question: 'Where can I still find acreage to build on in the Treasure Valley?',
        answer:
          'Mostly around Kuna, the edges of Star, Caldwell, Middleton, and the Eagle foothills. Boise and Meridian have very little acreage left inside their city limits. The trade-off with acreage is services: most of these parcels need a well, a septic system, and sometimes access work or a power extension, which commonly adds $80,000 to $150,000 before a foundation is poured. Compare that against a serviced lot at $25,000 to $50,000 of site work before deciding the land was cheaper.',
      },
      {
        question: 'Do I need a well and septic system in Meridian?',
        answer:
          'Almost never inside the city. Meridian new construction happens overwhelmingly on platted subdivision lots with city water, sewer, and pressurized irrigation already stubbed to the property, so site work sits in the $25,000 to $50,000 range. Well and septic becomes a question on unincorporated parcels outside the city boundary, and on the rural edges toward Kuna and Star. If you are looking at a parcel rather than a platted lot, check services before you make an offer.',
      },
      {
        question: 'Is building in the Boise foothills different from the valley floor?',
        answer:
          'Substantially. Slope drives foundation design, retaining, and driveway grade, access has to accommodate concrete trucks and a crane, a geotechnical report is required, and wildland-urban interface considerations affect exterior materials and defensible space. Steep foothills sites with a high level of detail regularly run above $450 per finished square foot, compared with $250 to $400 on the flat, serviced valley floor. Many foothills parcels are also off city services, adding well and septic costs on top.',
      },
      {
        question: 'How do I choose which city to build in?',
        answer:
          'Work backward from the lot rather than the city name. Decide how much land you actually want, whether you are willing to take on a well and septic, what commute you can live with, and how much design control you want to hand to a subdivision architectural committee. That usually narrows it to two cities quickly. Meridian and Star suit serviced subdivision building, Kuna and Caldwell suit acreage, Eagle suits larger and higher-finish builds, and Boise means infill or foothills.',
      },
    ],
  };

  return faqs[hubSlug] ?? [];
}

export function getLocationFaqs(
  cityName: string,
  citySlug: string,
  county: 'ada' | 'canyon',
): Array<{ question: string; answer: string }> {
  const countyLabel = county === 'ada' ? 'Ada County' : 'Canyon County';
  const otherCounty = county === 'ada' ? 'Canyon County' : 'Ada County';
  const healthDistrict =
    county === 'ada' ? 'Central District Health' : 'the county health district';

  return [
    {
      question: `Do you build new homes in ${cityName}?`,
      answer: `Yes. Boise Construction Co is a design-build home builder and ${cityName} is inside our regular service area. We build custom and semi-custom homes, and we build on lots our clients already own. One team handles design, engineering, permits, and construction under a single contract. See our <a href="/areas/${citySlug}">${cityName} area page</a> or our <a href="/services/custom-home-builder/${citySlug}">${cityName} custom home building</a> page for what that covers locally.`,
    },
    {
      question: `How much does it cost to build a house in ${cityName}?`,
      answer: `A custom home plans at $250 to $400 per finished square foot in 2026 and a semi-custom home at $225 to $300, both excluding land. A 2,400 square foot custom home lands between $600,000 and $960,000 on that basis. Site work is quoted separately: $25,000 to $50,000 on a serviced lot, or $80,000 to $150,000 on a rural parcel that needs a well, a septic system, and access.`,
    },
    {
      question: `Which county do ${cityName} building permits go through?`,
      answer: `${cityName} permits route through ${countyLabel}. ${countyLabel} and ${otherCounty} use different portals and different review cadences, so a drawing package assembled for one is not automatically ready for the other. We handle permits, plan review responses, engineering coordination, and utility applications in-house for both counties, and we schedule the inspections. If your address sits near the county line, we confirm jurisdiction before design gets underway.`,
    },
    {
      question: `Do lots in ${cityName} need a well and septic system?`,
      answer: `It depends entirely on the parcel. Platted lots inside the city are usually served by municipal water and sewer, which keeps site work in the $25,000 to $50,000 range. Parcels outside city services need a well, a septic system permitted through ${healthDistrict}, and sometimes access work or a power extension, commonly $80,000 to $150,000 before a foundation is poured. Check this before you make an offer on land.`,
    },
    {
      question: `How long does it take to build a house in ${cityName}?`,
      answer: `Plan on the better part of a year from first drawing to keys. Design and selections usually take a few months, permitting and plan review add more, and construction runs several months beyond that. A rural parcel needing a well and septic, a sloped site requiring engineering, weather, and long-lead items such as windows and cabinets are the usual reasons a schedule stretches. We publish a schedule once the plan and the site are known.`,
    },
    {
      question: `Can you build on a lot I already own in ${cityName}?`,
      answer: `Yes. Vertical construction on a lot you already own plans at $225 to $400 per finished square foot depending on plan complexity and finish level, with site work priced from what your parcel actually needs. We start with the lot itself: utilities, access, soils, slope, setbacks, and any subdivision design standards. See <a href="/services/build-on-your-lot/${citySlug}">build on your lot in ${cityName}</a>.`,
    },
  ];
}
