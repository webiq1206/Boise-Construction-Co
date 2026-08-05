/**
 * City and neighborhood guides for building a new home, under the
 * treasure-valley-locations hub.
 *
 * These are assembled from a per-place data table rather than written as twelve
 * standalone files, but the differentiating material is real prose written once
 * per place, not a template with the city name substituted in. That distinction
 * is the whole point: the previous version of this file generated twelve pages
 * whose only differences were a city name and a county label, which is exactly
 * the near-duplicate pattern that stops a location page from ranking.
 *
 * The shared scaffolding below is deliberately thin - a permit callout, a
 * services block, and a closing section - because everything that makes a page
 * worth reading has to come from the place-specific fields.
 */
import type { GuidePageData } from '../guideContent';

interface PlaceGuide {
  slug: string;
  /** Place name as it appears in prose. */
  name: string;
  /** Area page slug this guide points at. Neighborhoods borrow their city's. */
  citySlug: string;
  county: 'ada' | 'canyon';
  guideType: 'location' | 'neighborhood';
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  quickAnswer: string;
  takeaways: string[];
  /** What building here actually involves. 2 to 4 paragraphs of HTML. */
  landscape: string;
  /** Lots and land: what is available and what it costs to make buildable. */
  lots: string;
  /** The local wrinkle that catches people out here. */
  watchOut: string;
  /** Budget context specific to this place. */
  budget: string;
  faqs: Array<{ question: string; answer: string }>;
}

const countyLabel = (c: 'ada' | 'canyon') => (c === 'ada' ? 'Ada County' : 'Canyon County');

const PLACES: PlaceGuide[] = [
  {
    slug: 'boise-home-building-guide',
    name: 'Boise',
    citySlug: 'boise',
    county: 'ada',
    guideType: 'location',
    title: 'Building a Home in Boise',
    seoTitle: 'Building a New Home in Boise, Idaho',
    metaDescription:
      'What it takes to build a new home in Boise: infill lots, foothills sites, Ada County permitting, and what each of those does to a construction budget.',
    excerpt:
      'Boise has two very different building problems: tight infill lots inside the established grid, and foothills parcels where the site costs more than people expect.',
    quickAnswer:
      'Building a new home in Boise usually means one of two things: an infill lot inside the established city, where the constraint is the buildable envelope, or a foothills parcel, where slope and access drive the budget. Custom builds run $250 to $400 per finished square foot, excluding land, with foothills sites regularly above $450.',
    takeaways: [
      'Boise building splits into infill lots and foothills sites, and the two have almost nothing in common cost-wise.',
      'Infill parcels are usually serviced, so site work sits in the $25,000 to $50,000 band.',
      'Foothills sites bring slope, access, geotechnical work, and wildland-urban interface requirements.',
      'Permits route through the City of Boise and Ada County depending on the address.',
      'On a tight infill lot, the buildable envelope after setbacks decides the plan before preference does.',
    ],
    landscape: `<p><strong>Boise gives you two entirely different building problems depending on which side of the bench you are on.</strong> Inside the established city, new construction is mostly infill: a teardown, a split parcel, or one of the few remaining vacant lots inside a neighborhood built out decades ago. These are serviced, flat, and straightforward to build on, and the difficulty is spatial rather than technical. Front, side, and rear setbacks plus lot coverage limits carve a buildable rectangle that is frequently much smaller than buyers assume, and on a narrow lot that rectangle often rules out a single-level plan entirely.</p>
<p>Above the bench, the foothills are a different exercise. Slope drives excavation, retaining, and foundation design. Access has to satisfy the fire district, which on a long private drive is a real cost rather than a formality. Geotechnical investigation is commonly required, and wildland-urban interface considerations affect materials and defensible space. None of it is exotic, but all of it is money that a valley-floor budget does not carry.</p>`,
    lots: `<p><strong>Infill lots in Boise are expensive per square foot of land and cheap to make buildable; foothills parcels are the reverse.</strong> On an infill parcel the utilities are usually at the line, the street exists, and site work sits in the $25,000 to $50,000 range that a serviced lot normally carries. What you pay for is the land and the location. In the foothills the land can be less per acre and the site work far more, because you may be extending power, building a driveway to a fire-access standard, and moving a lot of dirt before anything is poured.</p>
<p>Either way, get the buildable envelope drawn on the actual parcel before committing to a plan. A written lot evaluation runs $950 to $3,500 and is the cheapest way to find out whether the house you want fits the ground you are buying.</p>`,
    watchOut: `<p><strong>The thing that surprises people building in Boise is how much of the plan is decided by the lot rather than by them.</strong> On an infill parcel, setbacks and coverage limits often mean the answer is a two storey with a compact footprint whether or not that was the preference, and the garage placement is frequently dictated by the width available between side setbacks. In the foothills, the driveway grade and the fire district access standard can eliminate an otherwise appealing building site. In both cases the constraint is knowable before purchase, and almost nobody checks.</p>`,
    budget: `<p>A straightforward custom home on a serviced Boise lot sits in the $250 to $400 per finished square foot band, excluding land. A simple single-level plan on a flat, serviced lot can approach $225. Foothills sites with meaningful slope and higher detail regularly run above $450 per finished square foot, and that is before the site work required to make the parcel buildable.</p>`,
    faqs: [
      {
        question: 'Can you still build a new house inside Boise city limits?',
        answer:
          'Yes, though the opportunities are mostly infill: a teardown and rebuild, a parcel that has been split, or one of the remaining vacant lots inside an established neighborhood. The building itself is straightforward because the lot is serviced and flat. The work is in confirming what fits inside the setbacks and lot coverage limits before you buy.',
      },
      {
        question: 'Is it more expensive to build in the Boise foothills?',
        answer:
          'Considerably. Foothills sites with real slope and higher detail regularly exceed $450 per finished square foot, against $250 to $400 for a custom home on a valley-floor lot, and that is before site work. Slope drives excavation and foundation cost, access has to meet fire district standards, geotechnical investigation is commonly required, and wildland-urban interface rules affect materials.',
      },
      {
        question: 'Who issues the building permit for a new home in Boise?',
        answer:
          'It depends on the address. Parcels inside the city limits go through the City of Boise, and parcels in unincorporated areas go through Ada County. Either way the package includes a site plan, an architectural set, stamped structural engineering, energy compliance documentation, and either utility will-serve letters or well and septic approvals. We handle the submissions.',
      },
      {
        question: 'How long does it take to build a house in Boise?',
        answer:
          'Design and engineering commonly take 8 to 16 weeks, plan review another 4 to 10 weeks, and construction runs from there. The two things that most often stretch that are late finish selections and plan revisions submitted after the permit application, both of which are avoidable. A foothills site with significant excavation adds time at the front of construction.',
      },
      {
        question: 'What does site work cost on a Boise infill lot?',
        answer:
          'On a serviced infill lot where power, water, and sewer are already at the property line, site work commonly runs $25,000 to $50,000, covering excavation, grading, drainage, the driveway approach, and utility connections. A foothills parcel that needs a well, a septic system, a long driveway, or a power extension moves into the $80,000 to $150,000 range.',
      },
    ],
  },
  {
    slug: 'meridian-home-building-guide',
    name: 'Meridian',
    citySlug: 'meridian',
    county: 'ada',
    guideType: 'location',
    title: 'Building a Home in Meridian',
    seoTitle: 'Building a New Home in Meridian, Idaho',
    metaDescription:
      'Building a new home in Meridian: subdivision lots, HOA design review, Ada County permitting, and what a serviced lot actually costs to build on.',
    excerpt:
      'Meridian is the most straightforward place in the valley to build, which is exactly why the constraints that do exist are the ones people miss.',
    quickAnswer:
      'Meridian is mostly serviced subdivision lots, which makes it the most predictable place in the Treasure Valley to build. Site work commonly runs $25,000 to $50,000, permits route through Ada County or the City of Meridian, and the real constraints are HOA design review and lot coverage rather than utilities.',
    takeaways: [
      'Meridian building is dominated by serviced subdivision lots with utilities at the line.',
      'Site work in the $25,000 to $50,000 band is the norm rather than the exception here.',
      'HOA architectural review is common and runs in parallel with the building permit.',
      'Lot coverage limits, not utilities, are what usually constrain the plan.',
      'Permits route through Ada County or the City of Meridian depending on the address.',
    ],
    landscape: `<p><strong>Meridian is the most predictable place in the Treasure Valley to build a house, because almost everything you build on is a serviced subdivision lot.</strong> Power, water, sewer, and gas are at the property line. The street exists. The ground is flat and the soils are generally well understood. Removing the utility and site unknowns removes most of the variance from a construction budget, which is why a Meridian build tends to land closer to its early estimate than one on rural acreage.</p>
<p>What remains is the design side. A great many Meridian parcels sit in developments with recorded CCRs and an architectural review committee, and that committee has opinions about elevations, materials, roof pitch, colours, and sometimes garage orientation. This is not an obstacle so much as an extra approval track that runs alongside plan review and needs to be started early rather than discovered late.</p>`,
    lots: `<p><strong>Buying in Meridian usually means buying a finished lot in a platted subdivision, and the question is what the plat and the CCRs allow rather than whether the parcel is buildable.</strong> Read the plat notes, the recorded CCRs, and the design guidelines before the offer. They will tell you minimum and maximum square footage, garage requirements, material palettes, and sometimes required roof pitches, and any of those can rule out a plan you have already fallen in love with.</p>
<p>Lot coverage is the usual pinch point. A large single-level plan plus a three-car garage plus a covered patio is a big ground footprint, and on a standard subdivision lot it either does not fit inside the buildable envelope or it fits with no useful back yard. That is the arithmetic that pushes a lot of Meridian plans to two storeys.</p>`,
    watchOut: `<p><strong>The mistake we see most in Meridian is treating HOA design review as a formality that happens after the drawings are done.</strong> It is a separate approval with its own submittal requirements and its own calendar, and a committee that meets monthly can hold a project for weeks if the first submission comes back with comments. Start it in parallel with design development, not after permit submission, and read the design guidelines before the elevations are drawn rather than after.</p>`,
    budget: `<p>A semi-custom home on a Meridian subdivision lot commonly sits in the $225 to $300 per finished square foot band, excluding land, and a full custom build runs $250 to $400. Because the lot is serviced, site work usually lands in the $25,000 to $50,000 range, which is the low end of what a Treasure Valley build can carry. That predictability is the main financial advantage of building here.</p>`,
    faqs: [
      {
        question: 'Is Meridian in Ada County?',
        answer:
          'Yes. Meridian is in Ada County, and residential building permits route through either the City of Meridian or Ada County depending on whether the parcel is inside the city limits. Both use Ada County processes rather than the Canyon County portals that Nampa, Caldwell, and Middleton use, which matters because the two counties run on different review cadences.',
      },
      {
        question: 'Do I need HOA approval to build in Meridian?',
        answer:
          'In most Meridian subdivisions, yes. The recorded CCRs typically establish an architectural review committee with authority over elevations, exterior materials, colours, roof pitch, and sometimes minimum square footage or garage orientation. Read the design guidelines before the elevations are drawn, and start the submission in parallel with design development rather than after permit submission.',
      },
      {
        question: 'What does it cost to build a house in Meridian?',
        answer:
          'A semi-custom home commonly runs $225 to $300 per finished square foot and a full custom home $250 to $400, both excluding land. Because Meridian lots are almost always serviced, site work usually sits in the $25,000 to $50,000 band, which is the lower end for this valley and one of the reasons Meridian budgets tend to hold.',
      },
      {
        question: 'Can I build a single-level home on a Meridian subdivision lot?',
        answer:
          'Sometimes, but the setbacks and lot coverage limits often make it difficult once you add a three-car garage and a covered patio. The ground footprint of a large single level is substantial, and on a standard lot it either exceeds the buildable envelope or leaves no usable back yard. Have the envelope drawn on your specific parcel before choosing a plan.',
      },
      {
        question: 'Are there still lots available to build on in Meridian?',
        answer:
          'Yes, though most of what is available is a finished lot in a platted subdivision rather than raw ground. That is generally good news for a build budget, because the utilities and the street are already in. The question shifts from whether the parcel is buildable to what the plat notes and CCRs will allow you to put on it.',
      },
    ],
  },
  {
    slug: 'eagle-home-building-guide',
    name: 'Eagle',
    citySlug: 'eagle',
    county: 'ada',
    guideType: 'location',
    title: 'Building a Home in Eagle',
    seoTitle: 'Building a New Home in Eagle, Idaho',
    metaDescription:
      'Building in Eagle: valley-floor acreage, foothills sites, strict design review, and why Eagle budgets run higher per square foot than the rest of Ada County.',
    excerpt:
      'Eagle covers flat valley acreage and steep foothills within the same city, and the two produce completely different construction budgets.',
    quickAnswer:
      'Eagle spans flat valley acreage and steep foothills, and the difference between them is the single biggest factor in an Eagle build budget. Valley-floor custom homes run $250 to $400 per finished square foot, excluding land, while foothills sites with slope and high detail regularly exceed $450. Design review here is unusually thorough.',
    takeaways: [
      'Eagle contains both flat valley acreage and steep foothills, with very different cost profiles.',
      'Design standards and architectural review in Eagle are among the most demanding in the valley.',
      'Larger parcels are common, which often means well and septic rather than municipal services.',
      'Foothills parcels bring slope, geotechnical work, access standards, and wildland-urban interface rules.',
      'Permits route through the City of Eagle or Ada County depending on the address.',
    ],
    landscape: `<p><strong>Eagle is two building environments inside one city, and the boundary between them matters more to a budget than anything else about the address.</strong> South and west of the state highway the ground is flat valley floor, frequently in larger parcels, and building there resembles building anywhere else on the valley floor except that the lots are bigger and services are not always at the line. North and east, the ground rises into the foothills, and every cost associated with slope arrives at once: excavation, retaining, engineered foundations, longer driveways to a fire-access standard, and geotechnical investigation.</p>
<p>Eagle also has a reputation for design standards, and it is deserved. Both the city and the individual communities within it tend to care about elevations, materials, massing, and how a house sits on its parcel. For a custom home that is often aligned with what the owner wants anyway, but it adds an approval track and it rules out value-engineering the exterior late in the process.</p>`,
    lots: `<p><strong>Eagle parcels are larger on average than the rest of Ada County, and larger parcels frequently mean private utilities.</strong> A property on acreage may need a well, a septic system, and a driveway of real length, which moves site work from the $25,000 to $50,000 serviced-lot band into the $80,000 to $150,000 range. Septic feasibility goes through Central District Health and depends on the soil, so it should be a purchase contingency rather than an assumption.</p>
<p>On foothills parcels, add slope. The building envelope on a hillside is often much smaller than the parcel suggests, and the practical building site may be determined by where a driveway can reach at an acceptable grade rather than by where the view is best.</p>`,
    watchOut: `<p><strong>The Eagle-specific trap is budgeting a foothills parcel as though it were a valley lot because both are in the same city.</strong> An Eagle address tells you almost nothing about what a build will cost. A flat, serviced parcel south of the highway and a sloped parcel above it can differ by well over a hundred per square foot on the house alone, before the site work difference, which can itself be six figures. Establish which one you are looking at before you set a budget.</p>`,
    budget: `<p>A custom home on flat, serviced Eagle ground sits in the $250 to $400 per finished square foot band, excluding land, and the finish expectations here tend to push toward the upper half of it. Foothills sites with meaningful slope and high detail regularly run above $450 per finished square foot. Rural acreage anywhere in Eagle should carry $80,000 to $150,000 of site work for well, septic, and access.</p>`,
    faqs: [
      {
        question: 'Why does building in Eagle cost more than Meridian?',
        answer:
          'Two reasons, and neither is the postcode. Eagle parcels are more often acreage requiring a well, septic, and a long driveway, which moves site work from the $25,000 to $50,000 band into $80,000 to $150,000. And a meaningful share of Eagle is foothills, where slope, engineered foundations, and access standards regularly push a build above $450 per finished square foot.',
      },
      {
        question: 'Do Eagle homes need well and septic?',
        answer:
          'Many do, particularly on acreage and in the foothills. Whether municipal water and sewer are available depends entirely on the parcel, and the answer should be verified in writing before purchase rather than assumed. Septic feasibility goes through Central District Health and depends on the soil, the groundwater depth, and the available drainfield area.',
      },
      {
        question: 'How strict is design review in Eagle?',
        answer:
          'More thorough than most of the valley. Both the city and individual communities within Eagle tend to have opinions about elevations, exterior materials, massing, and how a house sits on its site. For a custom home that usually aligns with the owner intent anyway, but it means the exterior cannot be value-engineered late and the review calendar has to be planned into the schedule.',
      },
      {
        question: 'What does it cost to build in the Eagle Foothills?',
        answer:
          'Foothills sites with real slope and high detail regularly exceed $450 per finished square foot, against $250 to $400 for a custom home on flat ground. On top of that, expect rural site work of $80,000 to $150,000 covering a well, a septic system, a driveway to fire-access standard, power extension, and the earthwork the slope requires.',
      },
      {
        question: 'Is Eagle in Ada County?',
        answer:
          'Yes. Eagle is in Ada County, and permits route through either the City of Eagle or Ada County depending on whether the parcel is inside the city limits. Septic permits for parcels on private systems are handled separately through Central District Health, which reviews the soil evaluation and the system design before the building permit work can proceed.',
      },
    ],
  },
  {
    slug: 'kuna-home-building-guide',
    name: 'Kuna',
    citySlug: 'kuna',
    county: 'ada',
    guideType: 'location',
    title: 'Building a Home in Kuna',
    seoTitle: 'Building a New Home in Kuna, Idaho',
    metaDescription:
      'Building a new home in Kuna: acreage parcels, well and septic, irrigation laterals, and how rural site work changes a Treasure Valley build budget.',
    excerpt:
      'Kuna is where a lot of Treasure Valley acreage builds happen, and acreage is where site work stops being a line item and becomes a second budget.',
    quickAnswer:
      'Kuna is dominated by acreage parcels, which means well and septic rather than municipal services on many sites. Rural site work commonly runs $80,000 to $150,000 before a foundation is poured, on top of $250 to $400 per finished square foot for the house. Permits route through Ada County or the City of Kuna.',
    takeaways: [
      'Much of what is available in Kuna is acreage rather than serviced subdivision lots.',
      'Rural site work with well, septic, and access commonly runs $80,000 to $150,000, excluding land.',
      'Septic feasibility depends on soil and goes through Central District Health.',
      'Irrigation ditches and laterals cross many Kuna parcels and carry delivery obligations.',
      'Kuna is in Ada County, so permits follow Ada processes rather than Canyon County ones.',
    ],
    landscape: `<p><strong>Kuna is where people go when they want ground, and ground changes the arithmetic of a build.</strong> A serviced subdivision lot hands you utilities at the property line and a street; an acreage parcel hands you a field. Between those two situations sits $80,000 to $150,000 of site work: drilling a well, designing and installing a septic system, building a driveway long enough and solid enough to satisfy the fire district, extending power, and grading for drainage. None of that appears in a per-square-foot figure for the house, and it is the single most common reason a Kuna budget comes apart.</p>
<p>The upside is real. Acreage in Kuna is the most attainable way in this valley to build the house you want with room around it, and the building itself is straightforward once the site is prepared. The ground is generally flat, which keeps excavation and foundation costs sensible compared with the foothills.</p>`,
    lots: `<p><strong>Before you buy acreage in Kuna, get three answers in writing: whether the septic will perc, where the power is, and whether the access is legally recorded.</strong> Septic feasibility is decided by the soil and reviewed by Central District Health, and a parcel that requires an engineered rather than a conventional gravity system costs materially more and takes longer to permit. Power that is a quarter mile away is a real number, not a formality. And access that everyone has always used is not the same thing as access recorded on the title.</p>
<p>A written lot evaluation at $950 to $3,500 answers all three before the inspection period closes, and it is credited toward design if you build with us.</p>`,
    watchOut: `<p><strong>Irrigation is the Kuna-specific surprise.</strong> A great many parcels here are crossed by irrigation district ditches or laterals, and those carry easements, maintenance access, and sometimes an obligation to deliver water to a neighbour downstream. You cannot build over them, you often cannot pipe them without district approval, and they can sit exactly where the driveway wants to go. Find out which district has an interest in the parcel and what it requires before the offer, not after.</p>`,
    budget: `<p>The house itself follows the same bands as the rest of the valley: $225 to $300 per finished square foot for semi-custom, $250 to $400 for custom, excluding land. What distinguishes a Kuna acreage build is the $80,000 to $150,000 of rural site work sitting underneath that, against $25,000 to $50,000 on a serviced lot. Budget the site separately and early, because the range on it is wide and it is decided by conditions rather than by choices.</p>`,
    faqs: [
      {
        question: 'Do I need a well and septic to build in Kuna?',
        answer:
          'On acreage, usually yes, though it depends entirely on the parcel and whether municipal services reach it. Verify in writing before purchase rather than assuming. A well and septic together with a driveway and power extension put rural site work in the $80,000 to $150,000 range, which is separate from and additional to the cost of the house.',
      },
      {
        question: 'Is Kuna in Ada County or Canyon County?',
        answer:
          'Kuna is in Ada County. That matters more than it sounds, because Ada and Canyon County use different permit portals and run on different review cadences, so a builder who works mostly in Nampa or Caldwell is working in a different system. Septic permits are separate again and go through Central District Health.',
      },
      {
        question: 'What is an irrigation lateral and why does it matter?',
        answer:
          'It is a channel that carries irrigation water across a parcel, usually with a recorded easement, maintenance access rights, and sometimes an obligation to deliver water downstream. You cannot build over it and generally cannot pipe or relocate it without the district agreeing. Many Kuna parcels have one, and it can sit exactly where you wanted the driveway or the house.',
      },
      {
        question: 'How much does it cost to build a house in Kuna?',
        answer:
          'The house follows the valley bands: $225 to $300 per finished square foot for semi-custom and $250 to $400 for custom, excluding land. The difference in Kuna is underneath it. Acreage site work with a well, septic, driveway, and power extension commonly runs $80,000 to $150,000, against $25,000 to $50,000 on a serviced lot.',
      },
      {
        question: 'Can a well come in dry in Kuna?',
        answer:
          'Wells are priced by the foot and nobody knows the depth until the drilling stops, so the honest answer is that the cost is a range rather than a number. Most parcels in developed rural areas of the Treasure Valley produce water, but no driller can promise a depth or a flow rate in advance, which is why we budget the well as a range.',
      },
    ],
  },
  {
    slug: 'star-home-building-guide',
    name: 'Star',
    citySlug: 'star',
    county: 'ada',
    guideType: 'location',
    title: 'Building a Home in Star',
    seoTitle: 'Building a New Home in Star, Idaho',
    metaDescription:
      'Building in Star, Idaho: new subdivisions alongside working acreage, Ada County permitting, and what each type of parcel does to a build budget.',
    excerpt:
      'Star has both new platted subdivisions and working agricultural acreage, sometimes on the same road, and the two are different builds entirely.',
    quickAnswer:
      'Star mixes new platted subdivisions with agricultural acreage, so two parcels a mile apart can have completely different site costs. A serviced subdivision lot carries $25,000 to $50,000 of site work; acreage needing well, septic, and access carries $80,000 to $150,000. Star is in Ada County.',
    takeaways: [
      'Star has both finished subdivision lots and working acreage, with very different site costs.',
      'Star is in Ada County, so permits follow Ada processes.',
      'Agricultural parcels here commonly carry irrigation easements and water delivery obligations.',
      'Newer subdivisions usually have CCRs with architectural review.',
      'Confirm whether municipal water and sewer reach a parcel before assuming a serviced-lot budget.',
    ],
    landscape: `<p><strong>Star is in the middle of turning from farmland into subdivisions, and that transition is the defining fact about building here.</strong> On one road you have a newly platted development with utilities stubbed to each lot, CCRs, and an architectural committee. A mile away you have working acreage with an irrigation ditch along the boundary and no municipal service within reach. Both are Star addresses. Both are Ada County. They are not the same project and they should not carry the same budget.</p>
<p>For a buyer this is mostly good news, because it means Star still offers both options at a time when much of Ada County offers only one. It does mean that any general statement about what building in Star costs is useless until you have established which of the two you are looking at.</p>`,
    lots: `<p><strong>The first question on any Star parcel is whether municipal water and sewer actually reach it, and the answer should come from the provider rather than the listing.</strong> A parcel described as being near services may still need a well and a septic system, and that difference is worth tens of thousands of dollars. Where services are available, connection and impact fees apply and should be confirmed with the jurisdiction rather than estimated.</p>
<p>On agricultural ground, expect the same checks that apply anywhere rural here: septic feasibility through Central District Health, soils, legal recorded access, and whatever the irrigation district requires. A written lot evaluation at $950 to $3,500 covers all of it before the inspection period closes.</p>`,
    watchOut: `<p><strong>Land in transition carries obligations that outlast the farming.</strong> A parcel that has been irrigated for decades may have water rights, delivery duties to neighbouring parcels, and ditch easements recorded against it, and those do not disappear because the crop did. They constrain where you can build, where the driveway goes, and occasionally what you must continue to do for someone downstream. Read the title work properly and ask the irrigation district directly.</p>`,
    budget: `<p>House costs follow the valley bands: $225 to $300 per finished square foot semi-custom, $250 to $400 custom, excluding land. The variable in Star is entirely the site. A finished subdivision lot carries $25,000 to $50,000 of site work. Acreage needing a well, a septic system, a driveway, and power carries $80,000 to $150,000. Establish which one applies before setting a total budget.</p>`,
    faqs: [
      {
        question: 'Is Star in Ada County?',
        answer:
          'Yes, Star is in Ada County, so residential permits route through Ada County or the City of Star rather than through the Canyon County system used by Nampa, Caldwell, and Middleton. If a parcel is on a private septic system, that permit is separate again and goes through Central District Health, which reviews the soil evaluation and system design.',
      },
      {
        question: 'Are there still acreage parcels available in Star?',
        answer:
          'Yes. Star is mid-transition from agricultural land to subdivisions, so both finished lots and working acreage are available, sometimes within a mile of each other. That is increasingly unusual in Ada County. It also means you cannot assume anything about services, soils, or easements from the town name alone.',
      },
      {
        question: 'What does site work cost on a Star acreage parcel?',
        answer:
          'If the parcel needs its own well and septic system plus a driveway and a power extension, budget $80,000 to $150,000 before a foundation is poured, excluding land. A finished subdivision lot with utilities at the line is a different situation entirely, commonly $25,000 to $50,000. Confirm which one you have in writing before making an offer.',
      },
      {
        question: 'Do Star subdivisions have HOA design review?',
        answer:
          'Newer platted subdivisions in Star generally do. The recorded CCRs typically govern elevations, exterior materials, minimum square footage, and sometimes roof pitch and garage orientation. Read the design guidelines before the elevations are drawn, and treat architectural review as a parallel approval track with its own calendar rather than a formality at the end.',
      },
      {
        question: 'What about irrigation rights on former farmland in Star?',
        answer:
          'They frequently transfer with the parcel, along with ditch easements and sometimes an obligation to deliver water to a neighbour. Those constraints do not end when the farming does. They affect where the house and driveway can go and occasionally impose ongoing duties, so review the title work carefully and speak to the irrigation district before the offer rather than after.',
      },
    ],
  },
  {
    slug: 'middleton-home-building-guide',
    name: 'Middleton',
    citySlug: 'middleton',
    county: 'canyon',
    guideType: 'location',
    title: 'Building a Home in Middleton',
    seoTitle: 'Building a New Home in Middleton, Idaho',
    metaDescription:
      'Building in Middleton: Canyon County permitting, acreage and subdivision lots, irrigation easements, and realistic site work costs for a new home.',
    excerpt:
      'Middleton offers acreage at prices Ada County no longer does, and it runs on Canyon County permitting, which is a different system with a different rhythm.',
    quickAnswer:
      'Middleton sits in Canyon County, which uses different permit portals and a different review cadence from Ada County. It offers both subdivision lots and acreage, with rural site work at $80,000 to $150,000 and serviced lots at $25,000 to $50,000. House costs follow the standard valley bands.',
    takeaways: [
      'Middleton is in Canyon County, not Ada, so the permit path differs from Boise and Meridian.',
      'Both subdivision lots and acreage are available, with very different site costs.',
      'Irrigation district ditches and laterals cross many parcels here.',
      'Septic permitting on rural parcels goes through Central District Health.',
      'Acreage is more attainable here than in comparable Ada County locations.',
    ],
    landscape: `<p><strong>Middleton is the practical answer for people who want acreage in the Treasure Valley and have found Ada County prices unworkable.</strong> The ground is flat, the soils are generally agricultural and well drained, and the building itself is as straightforward as anywhere on the valley floor. What changes is the administrative side: Middleton is in Canyon County, and Canyon County runs its own portals and its own review cadence. A build here is not harder, but it is a different process from a build in Meridian, and a builder who has only worked in Ada County is learning it on your project.</p>
<p>There is a mix of parcel types. Newer platted subdivisions offer serviced lots with CCRs, and outside them there is genuine acreage, much of it still farmed or recently so.</p>`,
    lots: `<p><strong>On Middleton acreage the checklist is the standard rural one, and every item on it is worth money.</strong> Septic feasibility depends on the soil and is reviewed by Central District Health, so it belongs in the purchase contingencies. Confirm whether municipal water and sewer reach the parcel or whether a well is required. Verify that access is legally recorded rather than customary. Check what the irrigation district has recorded against the title, because ditches and laterals here are common and they constrain siting.</p>
<p>Where those questions come back well, Middleton acreage is one of the better value propositions in this valley for someone building a house with room around it.</p>`,
    watchOut: `<p><strong>Do not assume Ada County timelines and processes apply.</strong> Canyon County is a separate jurisdiction with its own submission requirements and its own review rhythm, and the gap between the two catches out both homeowners and out-of-area builders. Plan the permit stage against Canyon County's process specifically, and make sure whoever is submitting has actually done it there before.</p>`,
    budget: `<p>The house follows the valley bands: $225 to $300 per finished square foot for semi-custom, $250 to $400 for custom, excluding land. Site work is the variable. Serviced subdivision lots carry $25,000 to $50,000; acreage with a well, a septic system, a driveway, and a power extension carries $80,000 to $150,000. Middleton's advantage is usually in the land price rather than the build cost, which is the same here as anywhere on the valley floor.</p>`,
    faqs: [
      {
        question: 'Is Middleton in Ada County or Canyon County?',
        answer:
          'Middleton is in Canyon County. That is a practical difference rather than a trivial one, because Canyon County uses different permit portals and runs on a different review cadence from Ada County. A builder whose experience is mostly in Boise and Meridian is working in an unfamiliar system, and it is worth asking directly how many Canyon County permits they have pulled.',
      },
      {
        question: 'Is it cheaper to build in Middleton than in Meridian?',
        answer:
          'The house is not cheaper. Labour and materials are the same across the valley, so the per-square-foot bands apply equally. What is usually cheaper is the land, and that is where the saving comes from. If the parcel is acreage rather than a serviced lot, some of that saving goes back into $80,000 to $150,000 of rural site work.',
      },
      {
        question: 'Do Middleton parcels need well and septic?',
        answer:
          'Many acreage parcels do, though it depends on whether municipal services reach the property. Confirm it in writing with the provider before purchase. Septic feasibility is decided by the soil and reviewed by Central District Health, and a parcel needing an engineered rather than a conventional gravity system costs materially more and takes longer to permit.',
      },
      {
        question: 'How long does a Canyon County permit take?',
        answer:
          'Plan review commonly runs 4 to 10 weeks once a complete package is submitted, following 8 to 16 weeks of design and engineering, but the honest answer is that it depends on the completeness of the submission and the review load at the time. The most reliable way to shorten it is to submit a complete set and avoid revising the plans afterwards.',
      },
      {
        question: 'What should I check before buying acreage in Middleton?',
        answer:
          'Septic feasibility, water source, legally recorded access, soils, and what the irrigation district has recorded against the parcel. Ditches and laterals are common here and they constrain where the house and driveway can go. A written lot evaluation runs $950 to $3,500, answers all of it inside a normal inspection period, and is credited toward design if you build with us.',
      },
    ],
  },
  {
    slug: 'nampa-home-building-guide',
    name: 'Nampa',
    citySlug: 'nampa',
    county: 'canyon',
    guideType: 'location',
    title: 'Building a Home in Nampa',
    seoTitle: 'Building a New Home in Nampa, Idaho',
    metaDescription:
      'Building a new home in Nampa: Canyon County permitting, serviced subdivision lots, nearby acreage, and what each does to a construction budget.',
    excerpt:
      'Nampa is the largest city in Canyon County and has the widest range of buildable parcels, from serviced infill to acreage on the edge of town.',
    quickAnswer:
      'Nampa offers the widest range of buildable parcels in Canyon County, from serviced subdivision and infill lots to acreage at the edges. Permits route through the City of Nampa or Canyon County, which runs a different system from Ada County. House costs follow the standard valley bands of $225 to $400 per finished square foot.',
    takeaways: [
      'Nampa is in Canyon County, with a different permit path from Boise and Meridian.',
      'Both serviced lots and acreage are available, so site work costs vary widely.',
      'Serviced lots carry $25,000 to $50,000 of site work; acreage carries $80,000 to $150,000.',
      'Infill parcels exist inside the established city and are usually fully serviced.',
      'Construction labour and material costs are the same here as elsewhere in the valley.',
    ],
    landscape: `<p><strong>Nampa is the largest city in Canyon County and it offers more variety of buildable parcel than anywhere else on that side of the valley.</strong> There are serviced subdivision lots in newer developments, infill parcels inside the established city where utilities are already at the line, and acreage at the edges where a well and septic system may be required. Because those three situations produce very different site costs, the useful question in Nampa is never what it costs to build here but what it costs to build on this parcel.</p>
<p>Permitting runs through the City of Nampa or Canyon County depending on the address. Canyon County uses different portals from Ada County and works to a different cadence, and that is worth confirming your builder has actually navigated rather than assuming.</p>`,
    lots: `<p><strong>A serviced Nampa lot is one of the more economical places to build in the Treasure Valley, because the land is more attainable than Ada County and the site work is the same low band.</strong> Utilities at the property line put site work in the $25,000 to $50,000 range covering excavation, grading, drainage, the driveway approach, and connections. Connection and impact fees apply and should be confirmed with the jurisdiction rather than estimated from another city's schedule.</p>
<p>At the edges of town, ordinary rural diligence applies: septic feasibility through Central District Health, water source, recorded access, soils, and irrigation easements.</p>`,
    watchOut: `<p><strong>The thing to verify in Nampa is which jurisdiction actually reviews your parcel, because city and county boundaries here are not intuitive.</strong> A parcel that looks like it is in town may be in unincorporated Canyon County, and that changes the submission path, the fee schedule, and sometimes whether municipal services are available at all. Establish it at the start of design rather than discovering it at submission.</p>`,
    budget: `<p>House costs are the same as the rest of the valley, because labour and materials are: $225 to $300 per finished square foot for semi-custom, $250 to $400 for custom, excluding land. There is no Canyon County discount on construction. Where Nampa is more attainable is the land, and on a serviced lot the site work stays in the $25,000 to $50,000 band, so the total lands lower without the house being built any differently.</p>`,
    faqs: [
      {
        question: 'Is it cheaper to build a house in Nampa?',
        answer:
          'The construction is not cheaper. Labour and materials cost the same across the Treasure Valley, so the per-square-foot bands are identical to Boise and Meridian. What is usually more attainable is the land. On a serviced Nampa lot, site work stays in the $25,000 to $50,000 band, so the total project cost lands lower without any compromise in how the house is built.',
      },
      {
        question: 'Which county handles Nampa building permits?',
        answer:
          'Canyon County, through either the City of Nampa or Canyon County depending on whether the parcel is inside the city limits. Canyon uses different portals and a different review cadence from Ada County, so it is worth asking a prospective builder how many permits they have actually pulled on that side of the valley rather than assuming the experience transfers.',
      },
      {
        question: 'Are there acreage parcels near Nampa?',
        answer:
          'Yes, mostly at the edges of the city and in unincorporated Canyon County beyond them. Those parcels commonly need a well and a septic system, which puts site work in the $80,000 to $150,000 range rather than $25,000 to $50,000. Septic feasibility is decided by the soil and reviewed by Central District Health, so it belongs in the purchase contingencies.',
      },
      {
        question: 'Can I build on an infill lot in Nampa?',
        answer:
          'Yes, and infill inside the established city is often the most economical way to build here, because the utilities and the street already exist. The constraint is spatial rather than technical: setbacks and lot coverage limits carve a buildable envelope that is frequently smaller than the parcel suggests, and that envelope should be drawn before you choose a plan.',
      },
      {
        question: 'How long does it take to build a house in Nampa?',
        answer:
          'Design and engineering commonly take 8 to 16 weeks, Canyon County plan review another 4 to 10 weeks, and construction follows from there. The two most common causes of delay are the same everywhere: finish selections made late, and plan revisions submitted after the permit application, which push the project back into the review queue.',
      },
    ],
  },
  {
    slug: 'caldwell-home-building-guide',
    name: 'Caldwell',
    citySlug: 'caldwell',
    county: 'canyon',
    guideType: 'location',
    title: 'Building a Home in Caldwell',
    seoTitle: 'Building a New Home in Caldwell, Idaho',
    metaDescription:
      'Building in Caldwell, Idaho: Canyon County permitting, serviced lots and agricultural acreage, irrigation easements, and realistic site work budgets.',
    excerpt:
      'Caldwell puts serviced city lots and working agricultural ground within a few miles of each other, and the site work difference between them is six figures.',
    quickAnswer:
      'Caldwell offers serviced city lots and agricultural acreage within a short distance of each other, and the site work difference between them is substantial: $25,000 to $50,000 versus $80,000 to $150,000. Permits route through the City of Caldwell or Canyon County. House costs follow the standard valley bands.',
    takeaways: [
      'Caldwell is in Canyon County, with its own permit portals and review cadence.',
      'Serviced city lots and agricultural acreage are both available and cost very differently to build on.',
      'Irrigation ditches and water delivery obligations are common on former farmland here.',
      'Septic permitting on rural parcels goes through Central District Health.',
      'Construction costs match the rest of the valley; the land is where Caldwell differs.',
    ],
    landscape: `<p><strong>Caldwell offers the clearest example in the valley of how much the parcel matters and how little the town name does.</strong> Inside the city you can buy a serviced lot with utilities at the line and build for the same site work budget as a Meridian subdivision. A few miles out you can buy agricultural acreage that needs a well, a septic system, a driveway, and a power extension, and the site work alone is six figures. Same city, same builder, same house, wildly different total.</p>
<p>The building itself is straightforward in both cases. The ground is flat, the soils are agricultural and generally well understood, and there is no foothills factor here. The variation is entirely in what the site requires before the foundation.</p>`,
    lots: `<p><strong>On agricultural ground around Caldwell, irrigation is the first thing to investigate and often the most consequential.</strong> This is long-established farmland, and ditches, laterals, easements, and water delivery obligations are recorded against a great many parcels. They constrain where a house and a driveway can go, they cannot generally be piped or moved without district approval, and they do not lapse because the field is no longer farmed.</p>
<p>After that, the standard rural checks: septic feasibility through Central District Health, water source, legally recorded access, soils, and floodplain status. A written lot evaluation at $950 to $3,500 covers all of it inside a normal inspection period.</p>`,
    watchOut: `<p><strong>Verify whether a parcel is inside the city limits or in unincorporated Canyon County before design starts.</strong> It determines the submission path, the fee schedule, and frequently whether municipal water and sewer are available at all, which is the difference between a $25,000 to $50,000 site budget and an $80,000 to $150,000 one. It is a five minute question at the beginning and an expensive surprise later.</p>`,
    budget: `<p>Construction costs match the valley: $225 to $300 per finished square foot semi-custom, $250 to $400 custom, excluding land. There is no discount for being in Canyon County, because the trades and the materials are the same. The Caldwell advantage is land price, and whether it survives depends entirely on whether the parcel is serviced or needs a well, a septic system, and access.</p>`,
    faqs: [
      {
        question: 'Which county issues building permits in Caldwell?',
        answer:
          'Canyon County, through either the City of Caldwell or Canyon County depending on whether the parcel is inside the city limits. Canyon runs different portals and a different review cadence from Ada County, so establishing which jurisdiction has your parcel is one of the first questions at the start of design rather than something to sort out at submission.',
      },
      {
        question: 'What should I check before buying farmland in Caldwell to build on?',
        answer:
          'Irrigation first, because this is long-established farmland and ditches, laterals, easements, and water delivery obligations are recorded against many parcels and constrain where you can build. Then septic feasibility through Central District Health, water source, legally recorded access, soils, and floodplain status. A written lot evaluation at $950 to $3,500 covers all of it.',
      },
      {
        question: 'Is building in Caldwell cheaper than Boise?',
        answer:
          'The house is not. Labour and material costs are the same across the Treasure Valley, so a custom home runs $250 to $400 per finished square foot in either place, excluding land. Caldwell land is generally more attainable, which is where the difference comes from, though on acreage some of that goes back into rural site work.',
      },
      {
        question: 'Do Caldwell acreage parcels need a well and septic?',
        answer:
          'Many do, though it depends on whether municipal services reach the parcel, which should be confirmed in writing with the provider. Where they are required, expect rural site work of $80,000 to $150,000 covering the well, the septic system and its permitting through Central District Health, the driveway, power extension, and grading, all before a foundation is poured.',
      },
      {
        question: 'Is there a floodplain concern building near the river in Caldwell?',
        answer:
          'FEMA floodplain designation is worth checking on any parcel near a waterway anywhere in the valley, and it is a straightforward thing to verify before an offer. A floodplain designation does not necessarily prevent building, but it affects foundation design, elevation requirements, insurance, and cost, so it needs to be known during the inspection period rather than after closing.',
      },
    ],
  },
  {
    slug: 'eagle-foothills-home-building-guide',
    name: 'the Eagle Foothills',
    citySlug: 'eagle',
    county: 'ada',
    guideType: 'neighborhood',
    title: 'Building in the Eagle Foothills',
    seoTitle: 'Building a Home in the Eagle Foothills',
    metaDescription:
      'Building in the Eagle Foothills: slope, access, geotechnical work, wildland-urban interface, and why these sites regularly exceed $450 per square foot.',
    excerpt:
      'Foothills sites buy you the view and charge you for the ground. Here is where the money actually goes on a sloped Eagle parcel.',
    quickAnswer:
      'Eagle Foothills sites regularly exceed $450 per finished square foot, against $250 to $400 for a custom home on flat ground, and that is before site work. Slope drives excavation and foundation cost, access must meet fire district standards, geotechnical investigation is common, and wildland-urban interface rules affect materials.',
    takeaways: [
      'Foothills sites with slope and high detail regularly exceed $450 per finished square foot.',
      'Rural site work here commonly runs $80,000 to $150,000 for well, septic, and access.',
      'Geotechnical investigation is frequently required before foundation design.',
      'Driveway grade and fire district access standards can decide the building site.',
      'Wildland-urban interface considerations affect exterior materials and defensible space.',
    ],
    landscape: `<p><strong>A foothills parcel costs more to build on for reasons that are all physical and all predictable, which means they can be budgeted rather than discovered.</strong> Slope is the first. Getting a level building platform out of a hillside means excavation, engineered retaining, and often a stepped or deepened foundation, and all three scale with how steep the ground is. Second is access: a driveway on a slope has to hold a grade the fire district will accept, which frequently means a longer route than the direct one and real structural work to hold it.</p>
<p>Third is what is under the surface. Geotechnical investigation is commonly required before the foundation can be engineered, and the report sometimes changes the foundation type. Fourth is wildland-urban interface: exterior materials, roof assemblies, vents, and defensible space around the structure all carry requirements that a valley-floor build does not.</p>`,
    lots: `<p><strong>On a foothills parcel, the buildable area is usually a small fraction of the acreage, and its location is decided by the driveway rather than by the view.</strong> The best outlook is often somewhere a driveway cannot reasonably reach at an acceptable grade. Have the access route and the building platform established before purchase, because a parcel where those two things do not resolve is not a building site regardless of what it costs.</p>
<p>Services are usually private: a well, a septic system sized to soils that may be thin or rocky, and frequently a power extension. That is the $80,000 to $150,000 rural site work band, and on a difficult foothills parcel it can sit at the top of it.</p>`,
    watchOut: `<p><strong>The single most common foothills mistake is buying the view and discovering the access.</strong> Everything else on a sloped site is expensive but solvable with money. Access can be genuinely unsolvable if the grade, the geometry, or a neighbour's property makes a compliant driveway impossible. Establish the route first, in writing, before anything else about the parcel matters.</p>`,
    budget: `<p>Expect above $450 per finished square foot for a foothills home with meaningful slope and high detail, against $250 to $400 on flat ground. Add $80,000 to $150,000 of site work for well, septic, driveway, and power. Design and engineering also run toward the upper end of the 5 to 12 percent band here, because the structural and geotechnical work is genuinely more involved than a valley-floor build.</p>`,
    faqs: [
      {
        question: 'Why is building in the Eagle Foothills so much more expensive?',
        answer:
          'Slope, access, ground conditions, and fire requirements, in roughly that order. Getting a level platform out of a hillside means excavation and engineered retaining. A compliant driveway on a grade costs real money. Geotechnical investigation is commonly required and can change the foundation type. Wildland-urban interface rules affect exterior materials. Together these push builds above $450 per finished square foot.',
      },
      {
        question: 'Do I need a geotechnical report to build in the foothills?',
        answer:
          'Commonly, yes. The soils and the slope determine what foundation the structural engineer can design, and on hillside ground that is not something anyone can assume. The report is ordered early because the foundation design depends on it, and occasionally it changes the answer enough to affect where on the parcel the house should sit.',
      },
      {
        question: 'What is wildland-urban interface and how does it affect my build?',
        answer:
          'It refers to areas where development meets undeveloped wildland and wildfire risk is a design consideration. Practically it affects exterior materials, roof assemblies, eave and vent details, and the defensible space maintained around the structure. None of it is difficult to build, but it constrains material choices and adds cost relative to a valley-floor house.',
      },
      {
        question: 'Can any foothills lot be built on?',
        answer:
          'No, and access is usually the reason rather than slope. A parcel where a driveway cannot reach a building platform at a grade the fire district will accept is not a building site, and no amount of budget fixes it. Establish the access route and the platform location in writing before purchase, because everything else is secondary to those two questions.',
      },
      {
        question: 'What does site work cost on a foothills parcel?',
        answer:
          'Budget $80,000 to $150,000 for the rural package: a well, a septic system with its own permitting through Central District Health, a driveway built to fire access standards, power extension, and grading. On a steep or awkward parcel it sits at the upper end of that band, and the earthwork alone can be a substantial share of it.',
      },
    ],
  },
  {
    slug: 'hidden-springs-home-building-guide',
    name: 'Hidden Springs',
    citySlug: 'eagle',
    county: 'ada',
    guideType: 'neighborhood',
    title: 'Building in Hidden Springs',
    seoTitle: 'Building a Home in Hidden Springs, Idaho',
    metaDescription:
      'Building in Hidden Springs: design guidelines, architectural review, foothills access, and what a master-planned community expects from a new home.',
    excerpt:
      'Hidden Springs is a master-planned community with real design standards, which is a constraint if you fight it and an advantage if you plan around it.',
    quickAnswer:
      'Hidden Springs is a master-planned community with genuine architectural standards, so design review is a substantive approval rather than a formality. Building here means designing to the community guidelines from the first sketch. Construction costs follow the custom band of $250 to $400 per finished square foot, excluding land.',
    takeaways: [
      'Design review in Hidden Springs is substantive and governs elevations, materials, and massing.',
      'Read the design guidelines before elevations are drawn, not after.',
      'The community sits north of Boise with foothills access considerations.',
      'Architectural review runs in parallel with Ada County plan review, on its own calendar.',
      'Custom builds here follow the $250 to $400 per finished square foot band, excluding land.',
    ],
    landscape: `<p><strong>Hidden Springs was planned as a coherent community rather than a collection of lots, and that shows up in how a new house gets approved.</strong> The design guidelines cover things that in most subdivisions are left to the builder: massing, roof form, material palette, window proportion, how the house addresses the street, and how outbuildings and fences relate to the main structure. The review committee applies them seriously.</p>
<p>For an owner building a considered custom home, this is usually a benefit rather than a burden, because it protects the setting they are buying into. It does mean the exterior design is not a place to save money late in the process, and it means the review calendar is a real item in the schedule rather than a rubber stamp at the end.</p>`,
    lots: `<p><strong>Lots here are within a planned community, so the infrastructure question is largely settled and the design question is the live one.</strong> What varies is the individual parcel: its slope, its orientation, how it sits relative to neighbours, and what the guidelines require of a house in that specific position. Get the guidelines and the plat notes before making an offer, and read them with the plan you actually want to build in mind.</p>`,
    watchOut: `<p><strong>The failure mode here is designing the house first and reading the guidelines second.</strong> A plan that would be uncontroversial in a Meridian subdivision can require substantial exterior rework to pass review here, and that rework arrives after the drawings are done and the budget is set. Design to the guidelines from the first sketch and the approval is uneventful.</p>`,
    budget: `<p>Construction follows the custom band of $250 to $400 per finished square foot, excluding land, and the material and detail expectations that come with the design guidelines tend to place a Hidden Springs build in the upper half of it. Design and engineering at 5 to 12 percent of construction cost should be budgeted toward the higher end, because the exterior needs more design attention than a standard subdivision elevation.</p>`,
    faqs: [
      {
        question: 'How strict is architectural review in Hidden Springs?',
        answer:
          'Substantive rather than nominal. The guidelines address massing, roof form, material palette, window proportion, how the house meets the street, and outbuildings, and the committee applies them. This is not an obstacle if you design to the guidelines from the beginning, but it is a real approval with its own calendar and it should not be treated as a formality at the end of design.',
      },
      {
        question: 'What does it cost to build in Hidden Springs?',
        answer:
          'Construction follows the custom band of $250 to $400 per finished square foot, excluding land. The design standards and material expectations here tend to place a build in the upper half of that band. Budget design and engineering at the higher end of the 5 to 12 percent range too, because the exterior requires genuine design work rather than a stock elevation.',
      },
      {
        question: 'Does Hidden Springs review run at the same time as the county permit?',
        answer:
          'It can and it should. Architectural review and Ada County plan review are separate approvals on separate calendars, and running them in parallel is how you avoid adding weeks to the schedule. What causes delay is submitting to the county and then discovering that review comments require exterior changes that invalidate the submitted set.',
      },
      {
        question: 'Which county handles permits for Hidden Springs?',
        answer:
          'Ada County. The building permit package includes the site plan, architectural set, stamped structural engineering, and energy compliance documentation, the same as anywhere else in the county. The community architectural review is entirely separate from that and is administered by the community rather than by any government body.',
      },
      {
        question: 'Can I bring my own plan to Hidden Springs?',
        answer:
          'Yes, but expect it to need adaptation. A plan drawn for a standard subdivision lot frequently needs exterior rework to satisfy the community guidelines on massing, materials, and street presence. The cheapest time to do that is before the plan is finalised, which is why we read the guidelines at the start of design rather than treating review as a later hurdle.',
      },
    ],
  },
  {
    slug: 'harris-ranch-home-building-guide',
    name: 'Harris Ranch',
    citySlug: 'boise',
    county: 'ada',
    guideType: 'neighborhood',
    title: 'Building in Harris Ranch',
    seoTitle: 'Building a Home in Harris Ranch, Boise',
    metaDescription:
      'Building in Harris Ranch: planned community design standards, serviced lots at the edge of the Boise foothills, and what a new home there involves.',
    excerpt:
      'Harris Ranch is a planned community on the east edge of Boise where the lots are serviced and the design standards are the constraint that matters.',
    quickAnswer:
      'Harris Ranch is a planned community on the east side of Boise with serviced lots and community design standards. Site work sits in the $25,000 to $50,000 serviced band, permits route through the City of Boise, and the real constraint on a plan is the architectural guidelines rather than the utilities.',
    takeaways: [
      'Harris Ranch lots are serviced, so site work sits in the $25,000 to $50,000 band.',
      'Community design standards govern elevations, materials, and how homes address the street.',
      'Permits route through the City of Boise as part of Ada County.',
      'Lot coverage and setbacks are usually what constrain a plan here, not utilities.',
      'Custom builds follow the $250 to $400 per finished square foot band, excluding land.',
    ],
    landscape: `<p><strong>Harris Ranch is a planned community, which means the hard infrastructure questions are already answered and the design questions are the live ones.</strong> Lots are serviced, streets exist, and the ground at the valley-floor end of the community is straightforward to build on. Site work therefore sits in the $25,000 to $50,000 band that applies to any serviced lot, covering excavation, grading, drainage, the driveway approach, and connections.</p>
<p>What governs the build is the community's design framework: elevations, materials, how the house meets the street, and the general coherence the community is built around. As with any planned community, that is an approval track running alongside the city permit, and it needs to start early.</p>`,
    lots: `<p><strong>Because the parcels are serviced and platted, the useful diligence here is documentary rather than physical.</strong> Read the plat notes, the recorded CCRs, and the design guidelines before an offer. They set the envelope, the material expectations, and often minimum or maximum square footage. Combined with setbacks and lot coverage, they will tell you fairly precisely what can be built on a given lot, which is more useful than any general statement about the community.</p>`,
    watchOut: `<p><strong>Toward the eastern edge of the area the ground begins to rise, and a sloped parcel is a different build from a flat one even inside the same community.</strong> Slope brings excavation, retaining, and potentially a geotechnical report, and it can move a build meaningfully up from the flat-lot cost. Establish which kind of parcel you are looking at rather than assuming the community average applies to it.</p>`,
    budget: `<p>A custom home here follows the $250 to $400 per finished square foot band, excluding land, with serviced-lot site work of $25,000 to $50,000. Where a parcel has real slope, expect the excavation, retaining, and foundation work to move the number up, and on genuinely steep ground the foothills band above $450 per finished square foot becomes the right reference instead.</p>`,
    faqs: [
      {
        question: 'What does it cost to build in Harris Ranch?',
        answer:
          'A custom home follows the standard band of $250 to $400 per finished square foot, excluding land, with serviced-lot site work of $25,000 to $50,000. Parcels toward the eastern edge with real slope cost more, because excavation, retaining, and foundation work all scale with grade, and on steep ground the foothills reference above $450 becomes more accurate.',
      },
      {
        question: 'Are there design guidelines in Harris Ranch?',
        answer:
          'Yes. As a planned community it has a design framework governing elevations, exterior materials, and how homes address the street, administered through an architectural review process separate from the city building permit. Read the guidelines before the elevations are drawn, and run the review in parallel with plan review rather than sequentially.',
      },
      {
        question: 'Who issues building permits in Harris Ranch?',
        answer:
          'The City of Boise, as part of Ada County. The permit package is the standard one for a new home: site plan, architectural set, stamped structural engineering, energy compliance documentation, and utility will-serve confirmation. Community architectural review is separate and is administered by the community rather than by the city.',
      },
      {
        question: 'Are Harris Ranch lots serviced?',
        answer:
          'Yes. As a planned community the utilities are in and at the property line, which puts site work in the $25,000 to $50,000 band covering excavation, grading, drainage, the driveway approach, and connections. That predictability is one of the main practical advantages of building in a planned community rather than on raw ground.',
      },
      {
        question: 'What usually limits the plan on a Harris Ranch lot?',
        answer:
          'Setbacks, lot coverage, and the design guidelines, in combination. Utilities are not the constraint because they are already there. Have the buildable envelope drawn on the specific parcel and read the guidelines with your intended plan in mind, because between them they determine footprint, storey count, and often garage placement more decisively than preference does.',
      },
    ],
  },
];

function buildLocationGuide(p: PlaceGuide): GuidePageData {
  const county = countyLabel(p.county);
  const otherCounty = p.county === 'ada' ? 'Canyon County' : 'Ada County';

  const permitCallout =
    `<div class="callout note"><p class="callout-label">${p.name}: permit snapshot</p>` +
    `<p>New home permits for ${p.name} route through <strong>${county}</strong>, which uses different portals and a different review cadence from ${otherCounty}. ` +
    `The package includes a site plan, an architectural set, stamped structural engineering, energy compliance documentation, and either utility will-serve letters or well and septic approvals. ` +
    `Septic permits for parcels on private systems go through Central District Health. See <a href="/blog/ada-vs-canyon-county-permit-timelines">Ada vs Canyon County permit timelines</a>.</p></div>`;

  const content = [
    permitCallout,
    `<h2 id="building-here">What building in ${p.name} actually involves</h2>`,
    p.landscape,
    `<h2 id="lots">Lots and land in ${p.name}</h2>`,
    p.lots,
    `<p>Our <a href="/guides/buying-land-to-build-boise">guide to buying land to build on</a> covers the full diligence list, and a written <a href="/services/lot-evaluation">lot evaluation</a> at $950 to $3,500 documents it for a specific parcel before your inspection period closes.</p>`,
    `<h2 id="watch-out">The thing that catches people out here</h2>`,
    p.watchOut,
    `<h2 id="budget">What a ${p.name} build costs</h2>`,
    p.budget,
    `<p>For the full picture of what moves a construction budget, see the <a href="/guides/boise-home-building-cost-guide">Boise home building cost guide</a>, or run your size and finish level through the <a href="/#calculator">estimator</a> for a starting range.</p>`,
    `<h2 id="how-we-build">How we work in ${p.name}</h2>`,
    `<p><strong>We handle design, engineering, permitting, and construction under one contract, which means one accountable team from the first drawing to handover.</strong> That includes the ${county} submissions and inspections, the utility applications, and where relevant the septic approval through Central District Health. You get a line-item budget before we break ground, a published draw schedule, a written progress update every week, and a one-year workmanship warranty after possession. Our <a href="/guides/boise-home-building-process-guide">process guide</a> walks through every stage in order.</p>`,
    `<p>Services relevant here: <a href="/services/custom-home-builder">custom home building</a>, <a href="/services/semi-custom-homes">semi-custom homes</a>, <a href="/services/build-on-your-lot">build on your lot</a>, and <a href="/services/home-plans-design">home plans and design</a>. See also <a href="/areas/${p.citySlug}">our ${p.citySlug === p.name.toLowerCase() ? p.name : p.citySlug} service area page</a> and the <a href="/guides/treasure-valley-home-building-guide">Treasure Valley home building guide</a>.</p>`,
    `<h2 id="next-steps">Start with the parcel</h2>`,
    `<p>The fastest way to get a real answer about building in ${p.name} is to tell us about the specific parcel, because that is what determines the site budget and frequently the plan. <a href="/contact">Send us the address or parcel number</a> and we will tell you what we see, or start with the <a href="/#calculator">build cost estimator</a> for a planning range.</p>`,
  ].join('\n');

  return {
    slug: p.slug,
    title: p.title,
    seoTitle: p.seoTitle,
    metaDescription: p.metaDescription,
    excerpt: p.excerpt,
    content,
    author: 'Boise Construction Co',
    hubSlug: 'treasure-valley-locations',
    guideType: p.guideType,
    tags: [p.citySlug, p.name.toLowerCase(), 'idaho', 'new construction'],
    publishedAt: '2026-06-20',
    // Hero imagery comes from the blog image registry (see
    // scripts/generate-blog-image-registry.ts), which maps each location guide
    // to its own city streetscape. An explicit override here used to point at
    // /images/guides/<slug>.webp, files that never existed, so every location
    // guide rendered a broken hero. Omit the override and let the registry win.
    quickAnswer: p.quickAnswer,
    keyTakeaways: p.takeaways,
    faqs: p.faqs,
    linkedCities: [p.citySlug],
    relatedLinks: [
      { url: '/guides/treasure-valley-home-building-guide', anchor: 'Treasure Valley Home Building Guide' },
      { url: `/areas/${p.citySlug}`, anchor: `Building in ${p.name}` },
      { url: '/guides/boise-home-building-cost-guide', anchor: 'Home building costs' },
      { url: '/guides/buying-land-to-build-boise', anchor: 'Buying land to build on' },
      { url: '/services/custom-home-builder', anchor: 'Custom home building' },
    ],
    primaryKeyword: `home builder ${p.name.toLowerCase()}`,
  };
}

export const LOCATION_GUIDES: GuidePageData[] = PLACES.map(buildLocationGuide);
