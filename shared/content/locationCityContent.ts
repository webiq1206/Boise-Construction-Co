import { type ContentSection } from './wave1/snippets';

/**
 * City- and neighborhood-specific new-construction sections.
 *
 * Keyed by place rather than by full guide slug so the lookup survives slug
 * changes. `getCitySpecificSections` resolves the longest matching place key,
 * which keeps `harris-ranch-*` from resolving to `boise` and
 * `eagle-foothills-*` from resolving to `eagle`.
 */

const COST_GUIDE = '/guides/boise-home-building-cost-guide';
const LAND_GUIDE = '/guides/buying-land-to-build-boise';
const TV_GUIDE = '/guides/treasure-valley-home-building-guide';
const PERMIT_ARTICLE = '/blog/ada-vs-canyon-county-permit-timelines';

const CITY_SNIPPETS: Record<string, ContentSection[]> = {
  boise: [
    {
      h2: 'What building a new home in Boise actually involves',
      paragraphs: [
        '<strong>Boise is the most built-out city in the valley, so nearly all new construction here is infill.</strong> That means a scattered vacant lot in an established neighborhood, a parcel that comes available when an older house comes down, a split lot, or a site up in the foothills. There is very little raw subdivision ground left inside the city limits, and the lots that do come up tend to move quickly.',
        'Infill has its own cost profile. Water, sewer, and power are usually already in the street, which keeps site work in the serviced range, but the lot is tight, the neighbors are close, and there is nowhere obvious to stage material or park trades. Mature trees, alleys, existing retaining, and a grade that was set decades ago all have to be built around rather than graded away.',
      ],
    },
    {
      h2: 'Boise lots: flat and serviced in town, steep above it',
      paragraphs: [
        'The valley floor and the foothills are two different building problems. A flat serviced lot on the Bench, in the North End, or on the west side is the cheapest ground in the city to build on. A foothills lot brings slope, driveway grade, geotechnical requirements, retaining, and wildland-urban interface considerations, and steep sites with a high level of detail regularly run above $450 per finished square foot.',
        'Boise also carries more design constraint than the newer cities around it. Lot coverage, setbacks, and height limits are tighter on older platted lots, and new construction inside a historic district goes through exterior design review before the building permit is issued. We check the zoning envelope and any overlay during feasibility so the plan is drawn to what the lot will actually allow.',
      ],
    },
  ],
  meridian: [
    {
      h2: 'Meridian building is subdivision building',
      paragraphs: [
        '<strong>Meridian is the fastest-growing city in the valley, and nearly all of its new houses go up on platted subdivision lots rather than one-off parcels.</strong> If you are building here, you are most likely buying a lot from a developer inside an active phase, or building on a lot you already picked up in one. Acreage inside the city is rare.',
        'The practical upside is that the ground is serviced. City water, sewer, and pressurized irrigation are typically stubbed to the lot, so site work sits in the $25,000 to $50,000 range rather than the $80,000 to $150,000 a rural parcel needs for a well, a septic system, and access. Very little of what gets built inside Meridian needs a well.',
      ],
    },
    {
      h2: 'HOA design review and narrow lots',
      paragraphs: [
        '<strong>Most newer Meridian subdivisions run their own architectural review, and it is the step people forget to schedule.</strong> Guidelines commonly cover elevation style, exterior materials and colors, roof pitch, garage orientation, minimum finished square footage, and how closely your front can resemble the house three doors down. Review runs alongside the city submittal, and learning late that the committee wants a different elevation means redrawing sheets.',
        'The second Meridian constraint is lot geometry. Subdivision lots are often narrow, and side setbacks eat into that width quickly, which pushes plans taller and deeper rather than wider. We size the plan to the actual recorded lot dimensions before design gets far, and we prepare the architectural submittal as part of that work.',
      ],
    },
  ],
  eagle: [
    {
      h2: 'Eagle: bigger lots, higher finish, more site work',
      paragraphs: [
        '<strong>Eagle is where the larger lots are, and the houses match them.</strong> Acreage along the river corridor, estate parcels north of town, and foothills sites make up much of what is available, and buyers here generally build in the upper half of the custom band rather than the lower. Plan on $250 to $400 per finished square foot excluding land, with detailed foothills builds regularly above $450.',
        'Larger and further out also means less of Eagle is serviced. Parcels outside city utilities need a well, a septic system, and sometimes a power extension or a private drive, commonly adding $80,000 to $150,000 before a foundation is poured. Septic on a rural Ada County parcel is permitted through Central District Health, and the soil work behind it should happen before the plan is finalized, not after.',
      ],
    },
    {
      h2: 'Slope, views, and architectural committees in Eagle',
      paragraphs: [
        'On a view lot the grade drives the floor plan more than the floor plan drives the lot. Where the slope falls determines whether you get a walkout or a daylight lower level, where the driveway can land at a usable pitch, how much retaining is required, and which rooms face the view. Sloped sites need a geotechnical report and engineered foundations, and that work belongs at the front of the schedule.',
        'Many Eagle communities also run an architectural committee with real authority over exterior materials, rooflines, and color palettes. We build that review into the design phase rather than treating it as a permit afterthought.',
      ],
    },
  ],
  kuna: [
    {
      h2: 'Kuna still has ground, and much of it is former farmland',
      paragraphs: [
        '<strong>Kuna is one of the few Ada County cities where you can still choose between a serviced subdivision lot and an acreage parcel.</strong> Inside the city, newer plats are serviced and site work sits in the $25,000 to $50,000 range. Out toward the farm ground and the desert edge, parcels are larger, cheaper per acre, and usually not on city utilities.',
        'A rural Kuna parcel typically needs a well, a septic system permitted through Central District Health, and sometimes a driveway of real length or a power extension. That package commonly runs $80,000 to $150,000 before construction starts, and it is the number that surprises buyers who compared the land price against a subdivision lot and assumed they were saving money.',
      ],
    },
    {
      h2: 'Irrigation, canals, and what people build in Kuna',
      paragraphs: [
        'Most of the ground around Kuna was irrigated farmland, which leaves laterals, delivery ditches, and irrigation district easements crossing parcels. You cannot build over an easement, the district has to approve any crossing or piping, and the water right that comes with the parcel carries an obligation to keep delivery working for the neighbors downstream. That all belongs on the site plan, not at excavation.',
        'Because land is more attainable here, Kuna budgets tend to go into the house and the outbuilding rather than the dirt. Shop homes and barndominiums are a common answer on acreage, at $150 to $250 per square foot blended across living and shop space.',
      ],
    },
  ],
  star: [
    {
      h2: 'Star is growing fast on former farm ground',
      paragraphs: [
        '<strong>Star has two kinds of buildable ground, and which one you have changes the budget more than anything about the house.</strong> Inside the city, new subdivisions on former farmland are serviced and behave much like Meridian, with $25,000 to $50,000 of site work and subdivision design guidelines to satisfy. Outside it, acreage along the river corridor and the surrounding farm ground usually needs a well and a septic system, moving site work into the $80,000 to $150,000 range.',
        'Star sits in Ada County, so permits follow the Ada County path even though the Canyon County line is close by. If your address is near that line, confirming jurisdiction before design starts is worth the phone call, and we make it on the first visit.',
      ],
    },
    {
      h2: 'What to check on a Star parcel',
      paragraphs: [
        'Former irrigated ground brings district easements, laterals, and pressurized irrigation obligations that constrain where the house, the drive, and a septic drainfield can sit. Annexation status matters too: a parcel not yet inside the city may be reviewed differently and may not have services at the property line even when the subdivision across the road does.',
        'Construction costs otherwise follow the valley bands. A custom home runs $250 to $400 per finished square foot and a semi-custom home $225 to $300, both excluding land and both before site work.',
      ],
    },
  ],
  nampa: [
    {
      h2: 'Nampa: Canyon County permitting and lower land cost',
      paragraphs: [
        '<strong>Nampa is the largest city in Canyon County, and building here follows a different permit path than Ada.</strong> Canyon County uses its own portal and its own review cadence, and a builder who only works in Boise and Meridian will feel the difference. We work both counties regularly and prepare the submittal the way the reviewing jurisdiction expects to receive it.',
        'New construction in Nampa splits between infill on the older grid near downtown and new subdivisions on the south and west edges. Land generally costs less here than in Ada County, which is why Nampa is often where a given budget buys both the lot and the house rather than forcing a choice between them.',
      ],
    },
    {
      h2: 'Serviced lots and rural parcels around Nampa',
      paragraphs: [
        'Inside the city, lots are serviced and site work runs $25,000 to $50,000: excavation, foundation prep, utility connections, driveway, and final grade. Head out toward Lake Lowell and the surrounding farm ground and you are into well and septic territory, where $80,000 to $150,000 is the honest planning number once access and power are included.',
        'Construction cost itself does not fall because the address is in Nampa. Labor and materials price about the same across the valley, so a custom home is still $250 to $400 per finished square foot and a semi-custom home $225 to $300, excluding land. What changes in Nampa is what the ground under it costs.',
      ],
    },
  ],
  caldwell: [
    {
      h2: 'Caldwell is where farm ground becomes homesites',
      paragraphs: [
        '<strong>More of what gets built in Caldwell sits on land that was recently agricultural, and that shapes the entire project.</strong> Parcels split off larger farms are common, acreage is easier to find than in Ada County, and a good share of it sits outside city services. Caldwell also has infill on established streets near the older core, which is a completely different exercise on a much smaller lot.',
        'A parcel outside services needs a well, a septic system, and often a long driveway and a power extension, commonly $80,000 to $150,000 before a foundation is poured. Soil and percolation testing should happen before the plan is finished, because where the drainfield is allowed to go frequently decides where the house can go.',
      ],
    },
    {
      h2: 'Irrigation rights, soils, and Canyon County review',
      paragraphs: [
        'Converted farm ground carries irrigation district easements, delivery ditches, and water rights with obligations attached. Crossing or piping a lateral needs district approval, and the easement itself is not buildable area. Old farm ground can also hide buried debris, filled areas, and soft soils where a building pad or a corral used to be, which is why a geotechnical look is inexpensive insurance on a rural Caldwell parcel.',
        'Permits route through Canyon County, on a different portal and review cadence than Ada. Shop homes and barndominiums are popular on Caldwell acreage at $150 to $250 per square foot blended, and a conventional custom home runs $250 to $400 per finished square foot excluding land.',
      ],
    },
  ],
  middleton: [
    {
      h2: 'Middleton is small, semi-rural, and mostly acreage',
      paragraphs: [
        '<strong>Middleton building is dominated by acreage parcels and small subdivisions rather than large master-planned phases.</strong> The town is compact, the ground around it is farmland and rural residential, and the lots that come available are often an acre or several rather than a quarter of one. That is the appeal, and it is also most of the budget conversation.',
        'Parcels outside the serviced core need a well, a septic system, and access work, commonly $80,000 to $150,000 before construction begins. Inside a serviced subdivision, site work drops back to $25,000 to $50,000. Establishing which one you are buying is the single most valuable thing you can do before writing an offer.',
      ],
    },
    {
      h2: 'Building on a Middleton acreage parcel',
      paragraphs: [
        'On acreage the site plan comes before the floor plan. A well and a septic drainfield need required separation from each other and from property lines, the driveway may be hundreds of feet of gravel or paving, power may need extending from the nearest pole, and irrigation easements from the surrounding farm ground can cut straight across what looked like the best building spot.',
        'Middleton permits route through Canyon County, which uses a different portal and review cadence than Ada. Owners here often build a house and a shop together, and shop homes run $150 to $250 per square foot blended across living and shop space.',
      ],
    },
  ],
  'eagle-foothills': [
    {
      h2: 'Foothills sites: slope, access, and geotechnical work',
      paragraphs: [
        '<strong>A foothills lot is the most expensive ground in the valley to build on, and most of the difference is in the site rather than the house.</strong> Slope drives foundation design, retaining, and driveway grade. Access determines whether concrete trucks and a crane can reach the pad. A geotechnical report is not optional. Steep sites with a high level of detail regularly run above $450 per finished square foot against $250 to $400 for a valley-floor custom home.',
        'Most Eagle foothills parcels are also off city services, so a well, a septic system permitted through Central District Health, and often a power extension add $80,000 to $150,000. Wildland-urban interface considerations affect exterior materials, defensible space, and access width, and they are cheaper to design for than to retrofit.',
      ],
    },
    {
      h2: 'Designing to a view lot',
      paragraphs: [
        'The grade decides the plan. Where the slope falls sets whether you get a walkout lower level, where the garage can sit without an unusable driveway pitch, and which rooms face the view. Drainage has to be engineered rather than assumed, because water that used to run across an open hillside now runs across your house and your driveway.',
        'We sequence engineering and Ada County review early and aim to get site work into the dry season, when hillside access is workable and the schedule is not fighting the weather.',
      ],
    },
  ],
  'hidden-springs': [
    {
      h2: 'Building in a planned foothills village',
      paragraphs: [
        '<strong>Hidden Springs is a planned community in the Boise foothills with published design standards, so a new house here is designed to a rulebook as much as to a lot.</strong> Exterior materials, roof form, colors, porches, and how the house meets the street are reviewed by the community before the city permit. When a lot becomes available, the first design conversation is about what the standards allow.',
        'The upside is that the community is served rather than rural, so site work stays in the $25,000 to $50,000 band instead of the $80,000 to $150,000 a well and septic parcel needs. Lots still carry foothills grade, so a geotechnical look and a careful driveway study are worth doing before the plan is set.',
      ],
    },
    {
      h2: 'Costs and process in Hidden Springs',
      paragraphs: [
        'A custom home here runs $250 to $400 per finished square foot excluding land, with detail-heavy builds on sloped lots trending toward the top of that band. Design and engineering commonly land at 5 to 12 percent of construction cost.',
        'Permits route through Ada County, and the community architectural review runs alongside rather than instead of it. We prepare both packages so the two reviews are not waiting on each other.',
      ],
    },
  ],
  'harris-ranch': [
    {
      h2: 'Building in a master-planned East Boise community',
      paragraphs: [
        '<strong>Harris Ranch is master planned, fully serviced, and governed by design standards, which makes it one of the more predictable places in Boise to build.</strong> Utilities are in, the streets exist, and site work generally sits in the $25,000 to $50,000 range. What you trade for that predictability is design freedom: elevations, materials, massing, and colors are reviewed against the community pattern before you build.',
        'Lots here are limited and urban in scale, so the plan has to be drawn to the lot rather than adapted to it after the fact. Narrow widths, alley-loaded garages, and lot coverage limits shape the footprint before the first interior decision gets made.',
      ],
    },
    {
      h2: 'What it costs and what to expect',
      paragraphs: [
        'Expect the custom band of $250 to $400 per finished square foot excluding land, with the finish level in this part of East Boise generally pushing toward the upper half of it. Design and engineering typically add 5 to 12 percent of construction cost.',
        'Permits route through Ada County and the community design review happens in parallel. We prepare the architectural submittal during design so approval and plan review are not two delays in sequence.',
      ],
    },
  ],
};

/** Longest key first so `harris-ranch` wins over `boise` style prefixes. */
const SNIPPET_KEYS = Object.keys(CITY_SNIPPETS).sort((a, b) => b.length - a.length);

export function getCitySpecificSections(slug: string): ContentSection[] {
  const direct = CITY_SNIPPETS[slug];
  if (direct) return direct;
  const key = SNIPPET_KEYS.find((k) => slug === k || slug.startsWith(`${k}-`));
  return key ? CITY_SNIPPETS[key] : [];
}

export function buildLocationGuideSections(
  slug: string,
  cityName: string,
  citySlug: string,
  county: 'ada' | 'canyon',
  housingNote: string,
  guideType: 'location' | 'neighborhood',
): ContentSection[] {
  const countyLabel = county === 'ada' ? 'Ada County' : 'Canyon County';
  const healthDistrict =
    county === 'ada'
      ? 'Central District Health'
      : 'the county health district';
  const place = guideType === 'neighborhood' ? 'neighborhood' : 'city';

  return [
    {
      h2: `Building a new home in ${cityName}`,
      paragraphs: [
        housingNote,
        `This ${place} guide covers what the ground is like, whether parcels are serviced, which county reviews the permit, and what a new house costs to build here. For the valley-wide picture, start with the <a href="${TV_GUIDE}">Treasure Valley home building guide</a>.`,
      ],
    },
    ...getCitySpecificSections(slug),
    {
      h2: `Is the lot serviced, or does it need a well and septic?`,
      paragraphs: [
        `<strong>This one question moves a ${cityName} budget by roughly $100,000, so it is the first thing we check on any parcel.</strong> A platted lot with water, sewer, and power already at the street usually carries $25,000 to $50,000 of site work: excavation, foundation prep, utility connections, driveway, and final grade. A rural parcel that needs a well, a septic system, and sometimes a private road or a power extension commonly runs $80,000 to $150,000 before a foundation is poured.`,
        `Septic on a rural ${countyLabel} parcel is permitted through ${healthDistrict}, and the soil and percolation work behind it should be done before the floor plan is locked, because the drainfield location often decides the house location. A written lot evaluation costs $950 to $3,500 and answers these questions before you own the problem. See <a href="${LAND_GUIDE}">buying land to build on</a> and our <a href="/services/lot-evaluation/${citySlug}">${cityName} lot evaluation</a>.`,
      ],
    },
    {
      h2: `What a new home costs to build in ${cityName}`,
      paragraphs: [
        `<strong>A custom home in ${cityName} plans at $250 to $400 per finished square foot in 2026, and a semi-custom home at $225 to $300, both excluding land.</strong> A 2,400 square foot custom home lands between $600,000 and $960,000 on that basis. A simple single-level on a flat valley lot can come in near $225 per square foot; a steep foothills site with a high level of detail regularly exceeds $450.`,
      ],
      table: {
        className: 'cost-table',
        headers: ['Item', '2026 planning range, excluding land'],
        rows: [
          ['Custom home', '$250 to $400 per finished square foot'],
          ['Custom home, 2,400 sq ft', '$600,000 to $960,000'],
          ['Semi-custom home', '$225 to $300 per finished square foot'],
          ['Semi-custom, 2,000 sq ft', '$450,000 to $600,000'],
          ['Site work, serviced lot', '$25,000 to $50,000'],
          ['Site work, rural parcel with well and septic', '$80,000 to $150,000'],
          ['Design and engineering', '5 to 12 percent of construction cost'],
        ],
      },
    },
    {
      h2: `${countyLabel} permits for a ${cityName} build`,
      paragraphs: [
        county === 'ada'
          ? `<strong>A new home in ${cityName} permits through ${countyLabel}.</strong> That means the Ada County portal, Ada County plan review, and the Ada County inspection cadence, plus utility applications and any engineering the site requires. Ada and Canyon do not run the same process, so a set of drawings assembled for one is not automatically ready for the other.`
          : `<strong>A new home in ${cityName} permits through ${countyLabel}, not Ada.</strong> Canyon uses a different portal and a different review cadence than Boise and Meridian, and drawings assembled for an Ada submittal are not automatically ready for a Canyon one. If your address sits near the county line, confirm jurisdiction before design gets far.`,
        `We handle permits, plan review responses, engineering coordination, and utility applications in-house for both Ada and Canyon County. For how the two compare, see <a href="${PERMIT_ARTICLE}">Ada vs Canyon County permit timelines</a>.`,
      ],
    },
    {
      h2: `Building services in ${cityName}`,
      paragraphs: [
        `<a href="/services/custom-home-builder/${citySlug}">Custom home building</a> · <a href="/services/semi-custom-homes/${citySlug}">Semi-custom homes</a> · <a href="/services/build-on-your-lot/${citySlug}">Build on your lot</a> · <a href="/services/lot-evaluation/${citySlug}">Lot evaluation</a> · <a href="/areas/${citySlug}">${cityName} area page</a>.`,
        `Full planning bands by house type are in the <a href="${COST_GUIDE}">Boise home building cost guide</a>.`,
      ],
    },
    {
      h2: 'Next steps',
      paragraphs: [
        `Run your square footage and finish level through the <a href="/#calculator">estimator</a> for a planning range, then <a href="/contact">schedule a consultation</a> and we will walk the parcel with you before anyone draws a plan. If you have not bought land yet, that conversation is worth having first.`,
        '<a href="/#calculator">Estimator</a> · <a href="/contact">Schedule a consultation</a> · <a href="/guides">All guides</a>.',
      ],
    },
  ];
}
