import type { FAQItem } from '../seoContent';

export interface CityServicePageCopy {
  intro: string;
  faqs: FAQItem[];
}

/**
 * Per-service, per-city intros and FAQs for the 90 Construction service pages.
 * getCityServiceIntro and getCityServiceFaqs read this map and keep the
 * shared generator as the fallback for any pair that is not listed.
 */
export const CITY_SERVICE_COPY: Record<string, Record<string, CityServicePageCopy>> = {
  "shop-homes-barndominiums": {
    "boise": {
      intro: "Shop homes and barndominiums in Boise pair living space with real workspace. Near the North End and across Boise, the layout still has to meet local building requirements and fit the inspection schedule, so we plan the shop and the house together. Our design-build work includes a budget itemized line by line, written updates every week, and a written workmanship warranty. The estimator will show you a planning range, or you can go straight to booking a free planning consultation.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Boise?",
          answer: "Shop home prices in Boise move with the wider Treasure Valley. In 2026, these homes plan at $140 to $250 per square foot, blended across the finished and shop areas. A lot walkthrough produces a line-item budget for your specific site.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "Shop space costs far less to build than finished living space, which drags the blended average down, and a post-frame structure covers big spans with less material. Put the finished living areas side by side and the difference shrinks a lot.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "Usually, though fewer lenders offer them, and appraisals can be tougher where comparable sales are scarce. Find a lender who knows post-frame residential construction early, before you lock in a Boise design.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes. Boise is a regular market for us, and greater Ada County too, and we know how plan review and impact fees apply to a combined shop-and-living project there.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Boise?",
          answer: "Try the estimator for a quick planning range and follow up with a free planning consultation. With a lot in mind, we'll walk it together and point to the costliest site items, including room for a large shop footprint.",
        },
        {
          question: "Does a detached shop in Boise need a building permit?",
          answer: "If it's big enough. Boise's homeowner guide requires a building permit to build, demolish, or move a detached garage or shed over 200 square feet, and it treats stand-alone pergola or gazebo structures over 200 square feet as pole buildings, which need a permit too.",
        },
      ],
    },
    "meridian": {
      intro: "Shop homes and barndominiums in Meridian combine a house with serious shop space. Near Lochsa Falls and across Meridian, the combined building still has to meet local requirements and pass inspections in sequence. Planning and construction stay with one design-build team, and the project runs on an itemized cost sheet, weekly status reports, and a written warranty on how the work is done. The estimator is a quick start toward a planning range; a free planning consultation goes deeper.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Meridian?",
          answer: "Shop homes in Meridian follow Treasure Valley pricing. As of 2026, they plan at roughly $140\u2013$250 a square foot when the finished space and the shop space are blended together. A walkthrough of your lot leads to a budget itemized for the site.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "Because the shop area costs much less to build than finished rooms, the blended average drops, and post-frame construction spans wide areas with less material. If you compare only the finished living space, most of the gap disappears.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "Often, yes, though fewer lenders take them on and appraisals can be harder when there are few comparable sales nearby. Talk early with a lender experienced in post-frame homes, before the design is final.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. Meridian is our base, and we build regularly here and across Ada County, so local plan review and impact fees for shop-and-house projects are familiar.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Meridian?",
          answer: "Run the estimator for a shop home planning range, then book time with us for a free planning consultation. Once you have a lot in mind, we'll walk the ground together and explain its site cost drivers.",
        },
        {
          question: "How deep do footings go for a large detached shop in Meridian?",
          answer: "Meridian's handout for residential detached accessory structures requires footings down to the frost line, 24 inches deep, for buildings over 600 sq ft or ones with power and heat. The handout also lets a one-story shed of 200 sq ft or less skip the building permit. A shop home's foundation is engineered for frost depth and your soils.",
        },
      ],
    },
    "nampa": {
      intro: "Shop homes and barndominiums in Nampa put living space and a working shop under one plan. Near Downtown Nampa and across the city, the building still needs a layout that meets local requirements and the inspection sequence. Shop homes need the shop, the slab, and the living space sequenced right, which is why we build them design-build: an itemized budget, a written report weekly, and a written workmanship warranty. Request a free planning consultation about a Nampa shop home, or have the estimator work out a planning range for shop and living space.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Nampa?",
          answer: "Nampa costs track the general Treasure Valley market. For 2026, the valleywide planning figure for a shop home is $140 to $250 per square foot, blending finished and shop space. A walk of your land then leads to an itemized budget for the site.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "Shop square footage costs much less than finished living space, which lowers the blended average, and post-frame structure spans large areas using less material. Compare just the finished living space and the gap narrows a lot.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "Frequently yes. Fewer lenders offer these loans, though, and appraisals get harder in areas where comparable sales are thin. Speak early with a lender familiar with post-frame residential building, before you settle on a design.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Yes. Our crews build in Nampa routinely and around Canyon County, and Nampa's plan review and impact fees for a combined shop and house are familiar.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Nampa?",
          answer: "Get a planning range from our estimator, then sit down with us for a free planning consultation; shop dimensions help. If there's a lot you're considering, we'll walk it with you and identify what drives its site work.",
        },
        {
          question: "Does a separate shop building in Nampa need a permit?",
          answer: "Nampa's residential FAQ requires a permit for any detached shed larger than 200 sq ft, and for a shed of any size wired for 120 volts. Outdoor lighting on low voltage is exempt from electrical permits, while 110-volt lighting is not, which matters for yard and shop lighting.",
        },
      ],
    },
    "eagle": {
      intro: "Shop homes and barndominiums suit Eagle's larger lots and acreage. Near Banbury and across Eagle, the combined home and shop still has to be laid out for local building requirements and inspected on the city's schedule. Shop homes run design-build with us, so the shop and the living space are priced together on a line-item budget. Weekly updates come in writing, and the workmanship is covered by a written warranty. Book a free planning consultation about a shop home in Eagle, or try the estimator for a combined shop-and-house planning range.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Eagle?",
          answer: "Eagle prices run with the wider Treasure Valley market. Valleywide in 2026, a shop home plans at $140 to $250 per square foot once the finished and shop areas are blended. After we walk the lot, we prepare an itemized budget for that site.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "It's in the blend. Shop area is much cheaper to build than finished living space, so the average falls, and the post-frame system covers large spans using less material. Compare finished space against finished space and most of the difference disappears.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "Typically, yes. Expect a smaller lender pool and tougher appraisals wherever comparable sales are thin, so find a lender who understands post-frame residential construction early in the design.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "We do. We build in Eagle year-round and around greater Ada County, and the area's plan review process and impact fees for shop homes are familiar to us.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Eagle?",
          answer: "Use the estimator for a planning range, then reserve a free planning consultation to talk through shop size and living space. If you have land picked out, we'll walk it with you and point out the site cost drivers.",
        },
        {
          question: "Does Eagle have special rules for post-frame buildings?",
          answer: "Yes. Eagle's Building Division keeps a distinct set of submittal requirements for post-frame and pole barn structures, separate from the standard residential submittals it reviews under the 2018 IRC. We prepare the shop portion of an Eagle shop home to those requirements.",
        },
      ],
    },
    "kuna": {
      intro: "Shop homes and barndominiums are a good match for Kuna's larger parcels. Near Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and throughout Kuna, the combined house and shop must be laid out to Kuna's code and inspected on the city's timeline. Kuna shop homes are design-build projects for us, with an itemized budget split between shop and living space, written progress reports weekly, and our workmanship warranted in writing. The estimator gives a planning range for a shop home in Kuna, and your first planning consultation with us costs nothing.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Kuna?",
          answer: "Kuna budgets run with the overall Treasure Valley market. Shop homes in the valley are budgeted for 2026 at $140 to $250 a square foot, with finished and shop space averaged together. A walk-through of your lot then leads to an itemized budget for it.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "Shop space carries much less cost than finished space, so the blended average drops. Post-frame construction covers big spans with less material, too. Look at finished living space alone and the difference shrinks a lot.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "Usually you can. Expect fewer lenders to participate and a harder appraisal in areas with thin comparable sales, so talk early to a lender who has handled post-frame homes, ideally while the design is still loose.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "Yes. Kuna shop homes are frequent work for us, and so are projects around Ada County, and we're used to how Kuna reviews and charges impact fees on a barndominium.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Kuna?",
          answer: "For a real number, start with the online estimator's planning range, then a free planning consultation to go over your shop dimensions. We'll walk the parcel with you and identify its site cost drivers.",
        },
        {
          question: "What mechanical permit fees apply to a new Kuna shop home?",
          answer: "Kuna's fee schedule lists $93 for a new residential mechanical permit and $128 when the home includes a fireplace, with $93 for each additional furnace or fireplace. Shop homes often add a second heating system for the shop, so we account for that in the budget.",
        },
      ],
    },
    "caldwell": {
      intro: "Shop homes and barndominiums make sense on Caldwell's larger lots. Along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and throughout Caldwell, the home-and-shop building must still follow city code and pass inspections in turn. Ours is a design-build process, which brings a budget with every line shown, a written warranty covering workmanship, and weekly written updates. Our estimator gives a planning range in minutes; the first planning consultation is free.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Caldwell?",
          answer: "Caldwell costs run with the overall Treasure Valley. For 2026, shop homes valleywide are budgeted at about $140\u2013$250 per blended square foot, counting both finished and shop space. Once we walk the lot together, we deliver a line-item budget for the property.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "The shop portion carries much less cost than finished space, which pulls the blended average down. A post-frame building covers big spans with less material, too. Compare finished living space directly and most of the gap closes.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "Yes, in many cases. The lender pool is smaller, though, and appraisals can be harder where comparable sales are thin. Before you commit to a design, find a lender who has financed post-frame homes before.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "Yes. Our team builds in Caldwell often and around Canyon County, and we know how Caldwell treats a shop home in plan review and impact fees.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Caldwell?",
          answer: "First, try the estimator for a planning range, then schedule your free planning consultation; know roughly what shop size you need. If there's a lot on your list, we'll go walk it with you and identify what moves its site costs most.",
        },
        {
          question: "What do Caldwell's trade permits cost for a new shop home?",
          answer: "Caldwell's FY2026 schedule sets electrical, plumbing, and mechanical permits for a new one- or two-family home at $160 each when it's under 2,000 sq ft and $255 at 2,000 sq ft or more. How the finished area is counted on a shop home affects that bracket.",
        },
      ],
    },
    "star": {
      intro: "Shop homes and barndominiums fit Star's acreage parcels well. Near Star River Ranch and across Star, the combined building has to meet local building requirements and the city's inspection order. For a Star shop home, one design-build team prices the shop and the house line by line, writes you an update each week, and puts a warranty on its workmanship in writing. The estimator offers a planning range, and you won't pay for the planning consultation.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Star?",
          answer: "Star costs line up with the wider Treasure Valley picture. In 2026, shop homes in the valley plan at $140 to $250 per blended square foot, finished and shop space together. After we walk the lot together, we prepare a line-item budget for that site.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "Most of it comes from the blend. A shop costs far less per square foot than finished rooms, so the average falls, and post-frame structure spans big areas with less material. Compare only finished living space and the gap narrows considerably.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "In many cases, yes, though fewer lenders participate and appraisal can be tougher where comparable sales are thin. Have an early conversation with a lender familiar with post-frame homes, well before the plans are final.",
        },
        {
          question: "Do you build in Star?",
          answer: "We do. We're on site in Star frequently and in other Ada County towns, and we've taken shop homes through Star's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Star?",
          answer: "Price a shop home or barndominium in the estimator to see a planning range. After that, a free planning consultation is the place to bring sketches and shop dimensions. Already found a lot? We'll tour it with you and show you its site cost drivers.",
        },
        {
          question: "Does a big shop home in Star get a fire review?",
          answer: "It can. Star's residential submittal checklist routes buildings, or groups of buildings, reaching 4,000 sq ft or more to the fire district for a hydrant-flow check; if flow falls short, alternatives may be required. Large shop-and-house combinations often reach that size.",
        },
      ],
    },
    "middleton": {
      intro: "Shop homes and barndominiums suit Middleton's larger parcels. In Middleton Heights and around town, the house-and-shop building still follows Middleton's code and passes inspections one at a time. A Middleton barndominium is design-build with us. Expect a line-item budget, written progress updates every week, and a written warranty on the work. Book a free planning consultation about the barndominium you're planning in Middleton, or check what planning range the estimator gives for it.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Middleton?",
          answer: "Middleton costs track the overall Treasure Valley. Across the valley, shop homes plan for 2026 at about $140 to $250 a square foot, with shop and finished areas blended. A walk of your land then produces an itemized budget for your site.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "The shop portion is far cheaper to build than finished living area, so the blended average drops. A post-frame building also spans large areas with less material. Measure only the finished living area and most of the gap closes.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "Often, yes, though fewer lenders participate, and appraising gets tricky in places with few comparable sales. Have an early conversation with a lender experienced in post-frame residential construction, before the design is settled.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "Yes. We work in Middleton often, as well as other Canyon County towns, and our team knows the plan review steps and impact fees Middleton applies to a barndominium.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Middleton?",
          answer: "Use the online estimator for a planning range, and then set up a free planning consultation; note the door heights you need. For a lot you're considering, we walk it together and name what will drive its site costs.",
        },
        {
          question: "Is a permit needed for a big Middleton shop building?",
          answer: "If it's larger than 200 sq ft, yes. A new structure over that size needs a building permit under Middleton's code, and the city takes applications, payments, and inspection requests online through its Citizenserve portal.",
        },
      ],
    },
    "garden-city": {
      intro: "Shop homes and barndominiums in Garden City depend on what the lot can hold. Familiar with Ada County's plan review rules, impact fees, and the lots around Garden City, we size the house and shop to fit. We build shop homes design-build: one itemized budget for shop and house, a written update each week, and a warranty on our workmanship in writing. Schedule the free planning consultation, or use the estimator for a barndominium planning range on your Garden City lot.",
      faqs: [
        {
          question: "How much does shop homes & barndominiums cost in Garden City?",
          answer: "Garden City costs move with the general Treasure Valley picture. Shop homes across the valley plan in 2026 at roughly $140 to $250 per square foot, blending shop space with finished space. Arrange a lot walkthrough for an itemized budget for your site.",
        },
        {
          question: "Why is a shop home cheaper per square foot than a conventional house?",
          answer: "Shop space is far cheaper to build than finished rooms, so the blended number comes down, and post-frame structure spans wide areas using less material. Look at finished living space alone and most of the gap closes.",
        },
        {
          question: "Can I get a mortgage on a barndominium?",
          answer: "Typically, yes. Expect fewer lenders to participate and tougher appraisals in areas with thin comparable sales. Line up a lender experienced with post-frame homes before committing to a design.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "Yes. We run projects in Garden City frequently and in greater Ada County, and we're comfortable with Garden City's review and impact fees for a barndominium.",
        },
        {
          question: "How do I get a budget for shop homes & barndominiums in Garden City?",
          answer: "Price it in stages. Our estimator returns a rough planning range for a shop home, and a free planning consultation follows so we can talk shop size, doors, and living space. Have a Garden City parcel in view? Walk it with us, and we'll point to the conditions most likely to drive its site costs.",
        },
        {
          question: "Does a small detached building in Garden City need a permit?",
          answer: "Not always. Garden City's building code exempts one-story detached accessory buildings up to 200 sq ft from the building permit, but a full shop home is far larger and needs one. Fences over 8 feet also need design review and a building permit.",
        },
      ],
    },
  },
  "energy-efficient-homes": {
    "boise": {
      intro: "Energy-efficient homes in Boise start with a tight, well-insulated shell. Around the North End and through the rest of Boise, a high-performance house still has to satisfy local building requirements and pass the city's inspections on schedule. One design-build contract covers design and construction, and it comes with an itemized budget, a report in writing every week, and our workmanship warranty on paper. Have a performance goal in mind for your Boise home? Bring it to a free planning consultation, or let the estimator give you a planning range before we meet.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Boise?",
          answer: "Boise pricing for efficient homes follows the Treasure Valley as a whole. High-performance homes in the valley are planned at $275\u2013$425 a finished square foot for 2026, excluding land. Once we've walked the lot with you, you'll get a budget broken out by line for that site.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "A blower-door test pressurizes the house and measures how much air escapes through the envelope, turning air-tightness into a measured number instead of a promise. We run it partway through the build, when leaks are still cheap to seal, and again when the house is done.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "No. Solar is usually not the right place for the first dollar. Cutting the load with the envelope and the mechanical systems costs less per unit of energy saved, so build the Boise house tight first and add generation later if you want it.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes. We're in Boise and around Ada County on a regular basis, and our team knows how plan review and impact fees work there, high-performance builds included.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Boise?",
          answer: "Pull a planning range from the online estimator, then book a free planning consultation. Bring the lot you're considering into it; we walk it with you and spell out what will drive the site costs, including orientation for sun and shade.",
        },
        {
          question: "How hard does Boise's climate push on a house?",
          answer: "Both ways. NOAA's 1991\u20132020 normals for the Boise Air Terminal show about 5,320 heating degree days and 1,045 cooling degree days a year, with roughly 55 days at 90\u00b0F or above. A house here has to hold heat in winter and keep it out in summer, which is why we focus on the envelope first.",
        },
      ],
    },
    "meridian": {
      intro: "Energy-efficient homes in Meridian are built for hot, dry summers and freezing winter nights. Homes near Lochsa Falls and throughout Meridian still need layouts that meet local building requirements and inspection schedules, so efficiency is planned in from the start. Our Meridian team builds high-performance homes design-build. The budget comes itemized, the weekly updates come in writing, and a written warranty covers our work. Ask for a free planning consultation at our office in Meridian on a high-performance house, or see what planning range the estimator suggests.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Meridian?",
          answer: "Efficient homes in Meridian are priced in step with the Treasure Valley. Valleywide, high-performance homes plan at $275 to $425 a finished square foot in 2026, not counting land. We walk the lot and write an itemized budget for your site.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "The test pressurizes the house and measures the air leaking through its envelope, so air-tightness becomes a number rather than a claim. We test once mid-build, when leaks are inexpensive to fix, and once more at the end.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "No. Panels usually aren't the best first dollar. Cutting demand with a better envelope and better mechanical equipment saves energy more cheaply per unit, so build the Meridian home tight, then add generation if you'd like.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. Meridian is our base, Ada County is our regular territory, and a high-performance home moves through Meridian's plan review and impact fees like any other house we build.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Meridian?",
          answer: "Check the estimator's planning range, then come by our Meridian office for a free planning consultation. Already have a lot? We'll walk it with you, explain its site cost drivers, and look at how the house can sit for sun.",
        },
        {
          question: "How cold do Meridian winters get?",
          answer: "Cold enough to matter. At the Boise Air Terminal, the long-term station closest to Meridian, NOAA's 1991\u20132020 climate normals count about 108 nights a year at or under 32\u00b0F. The typical final spring freeze arrives around April 24, and the first one of fall around October 21. A tight envelope keeps heating loads down through that season.",
        },
      ],
    },
    "nampa": {
      intro: "Energy-efficient homes in Nampa have to handle long, hot summers and a lot of freezing nights. Whether it's near Downtown Nampa or in a newer subdivision, the floor plan must still satisfy Nampa's building rules and pass inspection on the city's schedule. Design-build lets us plan the envelope and the mechanical systems as one package. You'll get a line-by-line budget, written progress updates weekly, and a written workmanship warranty. Begin with a free planning consultation about building efficiently in Nampa, or run the numbers in the estimator for a planning range.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Nampa?",
          answer: "Nampa prices line up with the larger Treasure Valley picture. Valleywide, high-performance homes are budgeted at $275\u2013$425 per square foot of finished area in 2026, land excluded. Once we've walked your lot, we'll break the cost down line by line for your property.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "The blower door puts the whole house under pressure and reads the rate at which air slips out through the envelope. That makes air-tightness a figure you can check, not a claim. We test in the middle of construction, while sealing leaks costs little, and a second time when the home is complete.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "No. Panels are usually the wrong place for the first dollar. Lowering demand through the envelope and the mechanical systems is the cheaper way to save each unit of energy. Get the Nampa house tight, and add generation afterward if you'd like.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Yes. We run projects in Nampa routinely and across outlying parts of Canyon County, and an energy-efficient home goes through the same city review and impact fees as any other build there.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Nampa?",
          answer: "Our estimator produces a planning range, which the free planning consultation then narrows down; share any performance targets you have. For a lot under consideration, we walk it with you and call out the site cost drivers.",
        },
        {
          question: "What's the heating load like in Nampa?",
          answer: "Substantial. The Nampa Sugar Factory station averages roughly 5,550 heating degree days annually under NOAA's 1991\u20132020 normals, and roughly 13 days when the high never gets above freezing. That heating load is why we put the envelope and air sealing ahead of everything else.",
        },
      ],
    },
    "eagle": {
      intro: "In Eagle, an energy-efficient home suits owners who plan to stay put. Throughout Eagle, including Banbury, a high-performance house must still meet local building requirements and pass inspection in sequence. An efficient home goes best when one design-build team owns both drawings and construction. In Eagle that means a budget broken out by line, written updates each week, and a written warranty behind our workmanship. A free planning consultation about an efficient Eagle home is a good first step, or request a quote with your square footage and goals.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Eagle?",
          answer: "Eagle budgets line up with the general Treasure Valley. For high-performance homes, the 2026 valleywide planning range is about $275 to $425 for each finished square foot, not counting land. After a walk of your lot, we prepare a line-by-line budget for it.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "It's a whole-house leak test. A fan pressurizes the home and measures how much air the envelope lets through, converting a claim about tightness into a number. Our first test happens mid-build, when fixes are still cheap; the second, at completion.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "You don't need panels. The cheapest energy is the energy you never use, and improving the envelope and mechanical systems cuts load at a lower cost per unit. Panels usually aren't the right first dollar; get the house tight, then think about generation.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "Yes. Eagle is steady work for us, along with other Ada County towns, and we know Eagle's review and impact fees for high-performance homes.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Eagle?",
          answer: "A planning range comes first, from the estimator. The free planning consultation follows, where we go over your goals and how you like to heat the house. Any lot you're considering gets walked with you to flag what drives its site costs.",
        },
        {
          question: "Why does efficiency pay off for Eagle owners?",
          answer: "Most Eagle homes are owner-occupied, about 84% in Census ACS 2020\u20132024 estimates, so owners usually live with operating costs for years. The Boise Air Terminal, the closest long-term weather station, records around 5,320 heating degree days a year in NOAA's 1991\u20132020 normals, and a tight envelope trims that load every winter.",
        },
      ],
    },
    "kuna": {
      intro: "Energy-efficient homes in Kuna start with honest load calculations. Near Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and around Kuna, even a high-performance house has to follow the city's building code and get through each inspection on time. In Kuna we build efficient homes design-build: one team, a cost breakdown by line item, a written progress note weekly, and a workmanship warranty in writing. Schedule the free planning consultation for an efficient Kuna home, or check the estimator if you'd like its planning range first.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Kuna?",
          answer: "Kuna budgets follow the overall Treasure Valley. Across the valley, high-performance homes are planned this year at $275 to $425 for every square foot of finished area, before land. A walk of your lot then leads to a line-item budget for the site.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "Builders claim tight houses; this proves it. By pressurizing the house, a blower door shows in a single number how much air leaks through the envelope. Testing mid-build catches leaks while they're cheap to fix, and a test at completion confirms the result.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "No. The first dollar usually belongs elsewhere. Lowering the load with a better envelope and mechanicals costs less for each unit of energy saved. Start with a tight house, and add generation later if you like.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "We do. Kuna is regular work for us, like the rest of Ada County, and our team understands the city's review rules and impact fees.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Kuna?",
          answer: "Try the estimator for an energy-efficient home planning range. After that, book a free planning consultation, where you can share your efficiency goals. For a lot you might buy, we'll walk it with you and name what the site work will hinge on.",
        },
        {
          question: "Does Kuna require energy calculations for a new home?",
          answer: "Yes. Kuna's digital submittal requirements include a Manual J load calculation and, when the home doesn't follow the prescriptive energy path, a ResCheck report. We use those calculations to size heating and cooling equipment to the envelope instead of guessing.",
        },
      ],
    },
    "caldwell": {
      intro: "A Caldwell energy-efficient home must cope with hot summers and plenty of frost. From Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, to the city's edges, it still follows Caldwell's building code and each scheduled inspection. We build efficient homes design-build, which keeps envelope and mechanical decisions under one roof. Expect a line-item budget, a written update weekly, and our workmanship warranted in writing. Curious what an efficient Caldwell home costs? The estimator gives a planning range, and the first planning consultation is free.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Caldwell?",
          answer: "Caldwell budgets move with the broader Treasure Valley picture. Valleywide in 2026, high-performance homes run from $275 up to $425 per square foot of finished space, land excluded. Set up a walk of your site and we'll write an itemized budget for it.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "A blower door puts the house under pressure and reads how much air escapes through the envelope. Air-tightness goes from a claim to a number. We test partway through, while sealing leaks is still inexpensive, and once more when the house is done.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "Not to start. The first dollar goes further cutting load through the envelope and mechanical systems, which costs less per unit of energy saved than panels. After the house is built tight, generation is an easy add if you want it.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "We do. Caldwell projects come up routinely, along with nearby Canyon County towns, and we've worked through Caldwell's plan review and impact fees many times.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Caldwell?",
          answer: "Our online estimator is the quickest route to a planning range. From there, a free planning consultation lets us talk through the energy-efficient home you have in mind. Any lot you're considering gets a walk-through with us to identify what will move its site costs.",
        },
        {
          question: "What weather does a Caldwell home need to be built for?",
          answer: "Using NOAA's 1991\u20132020 normals from the Deer Flat Dam station by Lake Lowell, Caldwell-area summers bring about 41 days reaching 90\u00b0F and around 106 nights at or below freezing, with roughly 10 inches of precipitation. We design the envelope and equipment for both seasons.",
        },
      ],
    },
    "star": {
      intro: "Star's climate asks an energy-efficient home to handle cold nights and hot afternoons. Near Star River Ranch and across Star, even a high-performance house answers to city code and a series of inspections. For efficient homes in Star we work design-build. Expect the budget itemized, a written update about the house each week, and our workmanship covered by a written warranty. See a high-performance planning range in the estimator, or schedule a free planning consultation to talk through what you want your Star home to achieve.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Star?",
          answer: "Star budgets track the wider Treasure Valley picture. High-performance homes valleywide plan in 2026 at roughly $275 to $425 for every finished square foot, land excluded. Schedule a walk of your site and we'll prepare an itemized budget for it.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "The test pressurizes the home and measures air leakage through the envelope. It turns air-tightness into a number, not a claim. We run it during construction, while leaks are cheap to fix, and again at completion.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "No, you don't. Panels are usually the wrong first dollar. Cutting demand with the envelope and the mechanical systems saves energy at a lower cost per unit. Start with a tight house, then consider generation if you want it.",
        },
        {
          question: "Do you build in Star?",
          answer: "Yes. Star sees our crews year-round, as does outlying Ada County, and an efficient home goes through Star's plan review and impact fees just like any other house.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Star?",
          answer: "Lead with the estimator on our site, which gives a planning range, and follow it with a free planning consultation; bring any efficiency goals. For a lot you're weighing, we'll go see it with you and explain what its site costs will depend on.",
        },
        {
          question: "How cold does it get around Star in winter?",
          answer: "Cold enough to plan for. At the Boise Air Terminal, the nearest long-term NOAA station, the 1991\u20132020 normals show average December lows near 25\u00b0F and about 17.6 inches of snow a year. A tight, well-insulated envelope keeps heating costs in check through that season.",
        },
      ],
    },
    "middleton": {
      intro: "Middleton winters are real, and an energy-efficient home is built for them. Near Middleton Heights and across town, a high-performance house is still held to city code and each inspection. A tight, efficient house is easier with one design-build team owning the details. In Middleton that includes an itemized budget, a written report on the job weekly, and a written warranty on our workmanship. The planning consultation is free, and the estimator turns an efficient Middleton home's size and finish into a planning range whenever you want one.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Middleton?",
          answer: "Middleton prices move with the larger Treasure Valley. This year, a high-performance home in the valley is budgeted in a $275 to $425 range per finished square foot, with land excluded. After we walk the parcel with you, we prepare a line-item budget for it.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "It's how a builder proves a house is tight. A blower door pressurizes the house and puts the leakage through the envelope into one measured number. A mid-construction test finds leaks while repairs cost little, and a final test at completion confirms the result.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "Not at first. The first dollar rarely belongs on the roof. Every unit of energy saved is cheaper to get from the envelope and mechanicals, so reduce the load first. Build tight, and add generation later if you'd like.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "We do. Our builds happen in Middleton routinely and across greater Canyon County, and we know our way around Middleton's review and impact fees for efficient homes.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Middleton?",
          answer: "Lead with our online estimator and its planning range; the free planning consultation follows, and past utility bills help. Considering a lot? We walk it together and show you which factors set its site costs.",
        },
        {
          question: "Does Middleton require an air-leakage test?",
          answer: "Middleton's permit portal cites the Idaho energy envelope rule (IDAPA 24.39.30): the envelope must be tested and verified at no more than three air changes per hour in Climate Zone 5, though a visual inspection is accepted in lieu of testing, and the report is uploaded before final inspection. Our blower-door testing produces that number.",
        },
      ],
    },
    "garden-city": {
      intro: "A Garden City energy-efficient home has to handle hot river-valley summers and cold winter nights. We already know how Ada County reviews plans, which impact fees apply, and what Garden City lots are like, and we design the envelope to suit. High-performance work suits design-build because insulation, air sealing, and HVAC get planned together. You'll see an itemized budget, receive a weekly written report, and have a written warranty on the workmanship. Book a free planning consultation to talk efficiency targets for a Garden City house, or pull a quick planning range out of the estimator.",
      faqs: [
        {
          question: "How much does energy-efficient homes cost in Garden City?",
          answer: "Garden City costs track the general Treasure Valley. For 2026, plan on roughly $275 to $425 per finished square foot for a high-performance valley home, excluding land. Schedule a site walk for an itemized budget for your lot.",
        },
        {
          question: "What is a blower-door test and why does it matter?",
          answer: "A blower door pressurizes the house so we can measure air leakage through the envelope. Air-tightness becomes a number instead of a claim. We run one test during construction, when fixing leaks costs little, and a final one at completion.",
        },
        {
          question: "Do I need solar panels for an efficient home?",
          answer: "No, they aren't required. Solar panels are usually the wrong first dollar. Each unit of energy you save costs less through the envelope and mechanical systems, so reduce the load first. Make the house tight, then add generation if you want it.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "Yes. We're building in Garden City frequently, as well as in neighboring Ada County communities, and the city's plan review and impact fees for an efficient home are familiar.",
        },
        {
          question: "How do I get a budget for energy-efficient homes in Garden City?",
          answer: "Start with the estimator's planning range. A free planning consultation follows, where we talk through your performance goals. When a lot is in play, we walk it with you and name the conditions that will set its site costs.",
        },
        {
          question: "How hot do Garden City summers get?",
          answer: "Hot. NOAA's 1991\u20132020 normals for the nearby Boise Air Terminal show an average July high of about 92.7\u00b0F and around 1,045 cooling degree days a year. A tight envelope, good windows, and properly sized cooling keep summer bills down.",
        },
      ],
    },
  },
  "custom-home-builder": {
    "boise": {
      intro: "Thinking about custom home building in Boise, Idaho? Around the North End and elsewhere in the city, a new house usually has to be laid out around Boise's building rules and its inspection calendar. We build custom homes design-build. One team owns the design and the construction, the budget is laid out line by line, a written report reaches you every week, and a written warranty covers our workmanship. Most Boise custom homes we build start with a free planning consultation, and the estimator gives you a planning range if you'd like a starting figure.",
      faqs: [
        {
          question: "How much does custom home building cost in Boise?",
          answer: "Boise prices move with the wider Treasure Valley market. For 2026, most custom homes across the valley are budgeting between $250 and $400 a finished square foot, land not included. A walkthrough of your lot turns that figure into an itemized budget for your particular site.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "Expect roughly 10 to 14 months between the first design meeting and moving in. Design, engineering, and the permit usually take 3 to 5 months; the build itself takes 7 to 10. When a schedule slips, plan review in Ada or Canyon County is most often the reason, and inside Boise city limits the City of Boise does that review.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "No. Many Boise clients are better off calling before they buy. We look at a candidate lot's soils, utilities, access, and setbacks ahead of your commitment, since the parcel decides a big part of what the finished home costs.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes. Boise is a regular part of our schedule, and so is the rest of Ada County; we deal with the city's plan review and impact fees constantly. If you're unsure whether something needs a permit, the city's homeowner guide points you to (208) 608-7070.",
        },
        {
          question: "How do I get a budget for custom home building in Boise?",
          answer: "Run our online estimator to get a planning range for a custom home in Boise, then schedule the free planning consultation. Already eyeing a lot? We'll walk it together and point out what will push the site costs up or down.",
        },
        {
          question: "What permits does a new custom home need in Boise?",
          answer: "The City of Boise homeowner guide puts a new one- or two-family dwelling on its building permit list and also requires an erosion and sediment control permit for that work. Where footings must reach frost depth, the guide sets the minimum at 24 inches below grade. Those submissions and inspections go into our schedule from day one.",
        },
      ],
    },
    "meridian": {
      intro: "Custom home building in Meridian is close to home for us; Boise Construction Co is based here. In Lochsa Falls and the rest of Meridian, the floor plan has to work within the city's building rules and the order its inspections happen in. Meridian is home base for our design-build team. Custom home clients get a budget priced line by line, a written update each week of the build, and our workmanship guaranteed in writing. Request a free planning consultation, or have the estimator work up a custom home planning range from your square footage.",
      faqs: [
        {
          question: "How much does custom home building cost in Meridian?",
          answer: "Meridian custom home prices sit right in step with the Treasure Valley market. Most custom homes in the valley are planned in 2026 at somewhere from $250 to $400 a finished square foot, and that excludes land. Book a walkthrough of the lot and we'll write a budget, line by line, for your site.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "Ten to 14 months is a fair expectation from the start of design to the day you move in. Plan for 3 to 5 months of design, engineering, and permitting, followed by 7 to 10 months on site. Plan review, in Ada as well as Canyon County, causes more delays than anything else; Meridian homes are reviewed by the city's Building Services.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "You don't, and waiting is often the smarter move. Before you buy in Meridian, we can go over a candidate lot's soils, its utilities, the access, and any setback limits, because which parcel you pick sets much of the final cost.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. Our office is in Meridian, we take on projects here and across Ada County all the time, and local plan review and impact fees are routine for us. Permits inside city limits come from Building Services at 33 E. Broadway Ave.",
        },
        {
          question: "How do I get a budget for custom home building in Meridian?",
          answer: "Our online estimator puts a planning range on a Meridian custom home in a few minutes. Then reserve a free planning consultation; if a lot is on your list, we'll tour it with you and show which conditions are likely to raise site costs.",
        },
        {
          question: "What does Meridian charge to permit a new house?",
          answer: "The city's fee schedule lists a $150 application fee for new residential construction, which is non-refundable and credited to the building permit. The permit fee itself is $50 plus $5.50 for each $1,000 of valuation. Impact fees come on top, so we confirm current amounts with Meridian before pricing.",
        },
      ],
    },
    "nampa": {
      intro: "Looking at custom home building in Nampa, Idaho? From Downtown Nampa out to the newer edges of town, a new home's layout has to respect the city's building code and the timing of each inspection. The whole custom home runs design-build. You'll have an itemized budget, a written note from us each week on where the job stands, and our workmanship backed by a written warranty. Within a few minutes the estimator can show what a Nampa custom home might cost as a planning range, and your first planning consultation costs nothing.",
      faqs: [
        {
          question: "How much does custom home building cost in Nampa?",
          answer: "Nampa costs run with the broader Treasure Valley market. In 2026 the typical custom home in the valley plans at $250\u2013$400 a finished square foot, with land priced separately. Once we've walked your lot, you'll have an itemized budget written for that site.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "From the first design session to move-in, allow 10 to 14 months. Roughly 3 to 5 go to design, engineering, and permits; 7 to 10 go to building. Ada and Canyon County plan review timelines are where delays most commonly come from, and a Nampa home inside city limits goes through Nampa Development Services.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "No, and it's frequently better to call before buying. Our review of a candidate Nampa lot covers soils, utilities, access, and setback limits before you're committed, since the land you choose drives so much of the final budget.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Yes. Our crews are in Nampa all year and throughout Canyon County, and we know the city's review steps and the impact fees on a new custom house. Inside city limits, Nampa Development Services issues the permits.",
        },
        {
          question: "How do I get a budget for custom home building in Nampa?",
          answer: "Try the estimator first; it returns a planning range. A free planning consultation comes after that, and a rough square footage is enough to begin. If you're eyeing a Nampa lot, we'll come walk it and point out what will likely move the site costs.",
        },
        {
          question: "How does Nampa's weather affect a custom home?",
          answer: "It runs hot and cold. At the Nampa Sugar Factory weather station, the 1991\u20132020 NOAA normals average about 59 days a year at 90\u00b0F or warmer and roughly 132 nights at or below freezing, with just under 10 inches of snow. We specify insulation, windows, and air sealing for both extremes.",
        },
      ],
    },
    "eagle": {
      intro: "Custom home building in Eagle, Idaho often starts with a site that has views, slope, or acreage to work around. Near Banbury and in every other part of Eagle, the house has to be planned to the city's building requirements and its inspection calendar. One design-build team carries an Eagle custom home from sketch to keys. You see every cost as its own line, get a progress report in writing weekly, and receive a written workmanship warranty at move-in. Enter your custom home wish list in the estimator to get a planning range, or sit down with us over it at a free planning consultation.",
      faqs: [
        {
          question: "How much does custom home building cost in Eagle?",
          answer: "Eagle costs track the overall Treasure Valley picture. Across the valley in 2026, custom homes mostly budget $250 to $400 per finished square foot, before the cost of land. When we walk the parcel with you, the result is an itemized budget built around that site.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "Expect between 10 and 14 months from the first design meeting to moving in. Design, engineering, and permitting take roughly three to five months, and construction takes another 7\u201310 months. The most common source of delay is the plan review calendar in Ada and Canyon counties.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "No need. Buyers who call first usually do better. Before you commit to an Eagle lot, we walk through the setbacks, soils, access, and utility service, as the land determines much of the final cost.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "Yes. Eagle custom homes come up on our calendar often, as does work elsewhere in Ada County, and the plan review and impact fee steps there are routine for us.",
        },
        {
          question: "How do I get a budget for custom home building in Eagle?",
          answer: "Run the estimator on our site and note the planning range, then sit down with us at a free planning consultation, must-haves in hand. If you have a lot in view, we'll tour it together and name each thing that will drive its site costs.",
        },
        {
          question: "How does Eagle's plan review handle problems in a drawing set?",
          answer: "According to the City of Eagle Building Division, its plan reviewer either red-marks an issue on the plans or calls to talk through a solution. The posted turnaround of about six weeks for a single-family home assumes no revisions, so we submit complete, coordinated drawings.",
        },
      ],
    },
    "kuna": {
      intro: "Custom home building in Kuna, Idaho is usually a chance to start fresh on open ground. Along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and throughout Kuna, the plan still has to work within the city's building requirements and its inspection timeline. Because it's design-build, the budget arrives itemized, progress notes come in writing each week, and the finished house carries a written warranty on our work. For a Kuna custom home, start by booking a free planning consultation; the estimator will show a planning range if you want a figure in hand before we meet.",
      faqs: [
        {
          question: "How much does custom home building cost in Kuna?",
          answer: "Kuna budgets track the general Treasure Valley market. This year a typical custom home in the area is planned at somewhere between $250 and $400 for every square foot of finished space, and land is extra. Walk the property with us and we'll turn that into a line-item budget for your site.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "Count on 10 to 14 months from first design meeting to move-in: about 3 to 5 for drawings, engineering, and the permit, then 7 to 10 for construction. Plan review in Ada and Canyon counties is the most common source of delay.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "You don't. People who talk to us early tend to save money. Ahead of an offer, we walk through soils, access, setbacks, and utilities, since the lot accounts for a big piece of the final budget.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "Regularly, both in Kuna and in Ada County towns nearby. Kuna's review process and impact fees on a new custom home are second nature by now, and permits inside city limits come from the Kuna Building Department.",
        },
        {
          question: "How do I get a budget for custom home building in Kuna?",
          answer: "The estimator gives a planning range in minutes. Next, book a free planning consultation; sketches or a wish list are welcome. Thinking about a particular lot? We'll walk it with you and explain the conditions behind its site costs.",
        },
        {
          question: "What will a Kuna building permit cost for a new home?",
          answer: "Kuna's Building Department fee schedule charges a $70 residential submittal fee, then a valuation-based permit fee. A home valued between $250,001 and $500,000 pays $1,461 on the first $250,001, then $4.85 per additional $1,000 of value. Plan review, mechanical, plumbing, and impact fees are added separately.",
        },
      ],
    },
    "caldwell": {
      intro: "Custom home building in Caldwell, Idaho can mean an in-town lot or acreage at the edge of Canyon County farmland. Wherever it sits, from lots along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, outward, a new home's layout has to follow Caldwell's code and fit its inspection calendar. We design and build under one contract. Each cost of the house is itemized, a written update covers every week of the job, and you hold a workmanship warranty in writing. For a first number on a Caldwell custom home, run the estimator's planning range; for a real conversation, request a free planning consultation.",
      faqs: [
        {
          question: "How much does custom home building cost in Caldwell?",
          answer: "Caldwell pricing lines up with the broader Treasure Valley. For 2026, a typical custom home in the valley plans in the $250 to $400 range per finished square foot, excluding land. Ask us to walk the site, and we'll itemize a budget for it line by line.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "Plan on 10 to 14 months from starting design to moving in. The design, engineering, and permit phase accounts for roughly three to five months, and the build itself lasts another 7 to 10. The usual cause of slippage is plan review in Ada and Canyon County.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "Not at all; calling first often helps. Before you commit to a parcel, we check its soils, utilities, access, and setbacks, because the land can swing the final budget more than anything.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "We do, all the time, along with the rest of Canyon County. We know Caldwell's plan review rules and impact fees, and in town the permits come from the Department of Building Safety.",
        },
        {
          question: "How do I get a budget for custom home building in Caldwell?",
          answer: "The online estimator produces a custom home planning range; after that, sign up for the free planning consultation, with photos or a rough square footage if you have them. If a parcel has caught your eye, we'll visit it with you and name the likely drivers of its site costs.",
        },
        {
          question: "How is a Caldwell permit fee figured on a larger custom home?",
          answer: "Caldwell's FY2026 fee schedule (Resolution 300-25) bases the permit fee on valuation. For a project valued from $500,000 to $999,999, the fee is $2,755.45 plus about 0.43% of the value above $500,000, and residential plan review is charged on top at 40% of that fee.",
        },
      ],
    },
    "star": {
      intro: "Custom home building in Star, Idaho happens in one of the valley's fastest-growing cities. Near Star River Ranch and elsewhere in town, a custom plan has to fit Star's code and be built to its inspection schedule. It's a design-build job from start to finish. You'll work from a line-item budget, read a written status update weekly, and close out with a written warranty covering our workmanship. Ask us for a free planning consultation about your Star custom home, or let the estimator calculate a planning range from the size and finish level you choose.",
      faqs: [
        {
          question: "How much does custom home building cost in Star?",
          answer: "Star budgets follow the wider Treasure Valley picture. For 2026, valley custom homes are budgeting $250 to $400 for each square foot of finished area, not including land. After we walk the parcel with you, you get an itemized budget for your site.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "Most Star custom homes take 10\u201314 months, counting from design through move-in. About three to five of them cover drawings, engineering, and permitting, while the other 7 to 10 are spent building. When schedules slip, Ada and Canyon County plan review is usually why.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "Not required. Clients who reach out before buying tend to save money. Before any purchase, we review soils, access, setbacks, and utilities, because the parcel drives much of the final cost.",
        },
        {
          question: "Do you build in Star?",
          answer: "Yes. Star is steady work for our crews, along with greater Ada County, and the way Star handles plan review and impact fees for a custom home is familiar.",
        },
        {
          question: "How do I get a budget for custom home building in Star?",
          answer: "Open with the estimator on our website for a planning range. When it suits you, schedule a free planning consultation to go over scope and budget, wish list in hand. For a lot you might buy, we visit it with you and show where the site costs will come from.",
        },
        {
          question: "Does a custom home with a basement in Star need extra reports?",
          answer: "Yes. Under Star's February 2026 residential submittal checklist, a project that includes a basement needs a soils or geotechnical report bearing the stamp and signature of an engineer licensed in Idaho. We order that report early so the foundation design reflects it.",
        },
      ],
    },
    "middleton": {
      intro: "Custom home building in Middleton, Idaho often means more room than closer-in cities offer. In Middleton Heights and around the rest of town, the house still needs a layout that answers to Middleton's code and the order its inspections come in. Our design-build contract includes a custom home budget priced item by item, a weekly progress report in writing, and a workmanship warranty on paper. The estimator offers a custom home planning range any time of day, and a free planning consultation is there whenever you want to talk your Middleton plans over.",
      faqs: [
        {
          question: "How much does custom home building cost in Middleton?",
          answer: "Middleton prices track the larger Treasure Valley. This year's valleywide planning number for a custom home runs from $250 up to $400 per square foot of finished area, land not included. Have us walk the lot, and the figure becomes a line-item budget for your site.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "Budget 10 to 14 months from the first sketch to the keys. Design, engineering, and permits take three to five months or so, followed by 7 to 10 months of construction. Delays most often come from plan review in Ada and Canyon County.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "No, and it's often better to talk to us first. We check any parcel on your list for soils, utilities, access, and setbacks ahead of any commitment, since the parcel you pick shapes a big part of the final budget.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "Yes. Middleton custom homes are frequent work for us, along with jobs across Canyon County, and our team knows the city's review steps and impact fees. Permits in Middleton are filed through the Citizenserve portal.",
        },
        {
          question: "How do I get a budget for custom home building in Middleton?",
          answer: "Our estimator will show a custom home planning range. After that, schedule your free planning consultation, and feel free to bring photos of homes you like. Already found a lot? We'll walk the ground with you and spell out what is likely to drive its site costs.",
        },
        {
          question: "What's the plan review turnaround for a new Middleton home?",
          answer: "The City of Middleton Building Department's permit portal lists plan review and permit issuance for new residential projects at 4 to 6 weeks, depending on volume. We plan that window into the 3 to 5 months set aside for design, engineering, and permitting.",
        },
      ],
    },
    "garden-city": {
      intro: "For custom home building in Garden City, Idaho, the new house often sits among established homes. We know how Ada County plan review works here, what impact fees apply, and which lot conditions turn up most around Garden City. Custom homes here are handled design-build, which gives you an itemized budget, a written summary of each week on site, and a written warranty behind the work. Size up a Garden City custom home with the estimator's quick planning range, then talk it through at a free planning consultation.",
      faqs: [
        {
          question: "How much does custom home building cost in Garden City?",
          answer: "Garden City pricing follows the larger Treasure Valley. For 2026, the valley's custom homes typically plan at about $250\u2013$400 per finished square foot, plus land. Request a lot walkthrough and we'll write an itemized budget specific to your site.",
        },
        {
          question: "How long does it take to build a custom home in the Treasure Valley?",
          answer: "Most Garden City custom homes take 10 to 14 months from design kickoff to move-in. Roughly 3 to 5 of those months are spent on design, engineering, and permits, while 7 to 10 are construction. When schedules slip, it's most often plan review timing in Ada and Canyon County.",
        },
        {
          question: "Do I need to own land before I contact a builder?",
          answer: "No, and in many cases it's better to talk to us first. We look over lots you're considering for setbacks, access, utilities, and soils before you sign, since the land itself drives much of what the home costs.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "Yes. Garden City projects come up regularly, as do builds around Ada County, and we've walked new custom houses through Garden City's review and impact fees before. Permits there go through the city, not the county.",
        },
        {
          question: "How do I get a budget for custom home building in Garden City?",
          answer: "First, try our online estimator to see a custom home planning range. Then reserve your free planning consultation. When a particular lot becomes a contender, we'll go over it in person and point out the conditions that drive its site costs.",
        },
        {
          question: "What fees does Garden City charge on a new house?",
          answer: "For a new house, Garden City's residential permit page names these typical fees: an administrative setup fee, the building permit (which covers the standard inspections), a structural review, a design compliance review with its inspection, and, for lots in a floodplain, a floodplain review. Current amounts get confirmed before we price.",
        },
      ],
    },
  },
  "semi-custom-homes": {
    "boise": {
      intro: "Semi-custom homes in Boise start from a plan that already works and change what matters to you. A house near the North End, or anywhere else in Boise, still has to line up with local code and the inspection sequence, so we adapt the plan with both in mind. The semi-custom contract is design-build, which brings a line-item budget for your version of the plan, a written update each week, and a written warranty on workmanship. Get a planning range for a semi-custom Boise home from our estimator, or bring the plan you like to a free planning consultation.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Boise?",
          answer: "In Boise, costs move with the rest of the Treasure Valley. Valleywide, semi-custom homes are planning at $225\u2013$300 a finished square foot in 2026, before land. We price your exact site after a lot walkthrough, with a budget laid out line by line.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "A semi-custom home begins with an existing plan that is already engineered, and we modify it; a fully custom home is drawn from nothing. Semi-custom moves faster and keeps the budget range tighter, while fully custom puts every decision about layout and massing in your hands.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "No. A Boise semi-custom house gets the same framing, the same envelope, the same mechanical systems, and the same workmanship standards as our custom work. What changes is only how much design is finished before you arrive.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes, Boise and the Ada County communities around it are places we build often, and plan review and impact fees in the city are familiar ground for our team.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Boise?",
          answer: "Use the estimator for a semi-custom planning range, then set up a free planning consultation and bring a plan you like. Once a lot is a candidate, we walk it with you and point out its site cost drivers.",
        },
        {
          question: "Is most new construction in Boise infill?",
          answer: "A lot of it is. Census ACS 2020\u20132024 estimates show only about 13% of Boise's homes were built in 2010 or later, and the median home dates to 1986. A semi-custom plan often has to be narrowed, flipped, or re-sited to suit an established lot, which is part of the modification work.",
        },
      ],
    },
    "meridian": {
      intro: "Semi-custom homes are a natural fit for Meridian, where most houses are detached homes on subdivision lots. Whether it's in Lochsa Falls or another part of the city, the adapted plan still has to satisfy local requirements and move through inspections in order. Our Meridian team takes semi-custom homes design-build, with an itemized budget for each plan change, weekly updates in writing, and a written warranty on workmanship. You can book a free planning consultation right away, or have our estimator rough out a semi-custom planning range first.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Meridian?",
          answer: "Meridian prices follow the wider Treasure Valley market. In 2026, semi-custom homes across the region plan for $225\u2013$300 for each finished square foot, with land left out. Once we walk the lot, you receive a budget itemized for that particular site.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "Semi-custom means we take a plan that's already engineered and change it to suit you. Fully custom means drawing from a clean sheet. The semi-custom path is quicker and its price band narrower; going fully custom hands you total control of the layout and the home's massing.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "Not at all. The framing, the envelope, the mechanical systems, and our workmanship standards don't change between the two. A semi-custom Meridian home simply arrives with more of the design work already behind it.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. We're based in Meridian and build across Ada County, so the city's plan review and impact fees on semi-custom homes are routine for us.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Meridian?",
          answer: "Pull a planning range from the estimator, then schedule your free planning consultation. Got a Meridian lot in mind? We'll go out to it with you and explain what is going to drive the cost of site work there.",
        },
        {
          question: "Why do semi-custom plans suit Meridian lots?",
          answer: "Meridian is mostly detached single-family homes on relatively new lots. Census ACS 2020\u20132024 estimates put about 82% of its housing in detached houses, with a median year built of 2007 and roughly 40% of homes built in 2010 or later. Proven plans adapt well to lots like these.",
        },
      ],
    },
    "nampa": {
      intro: "Semi-custom homes in Nampa give you a proven plan with your changes built in. Lots near Downtown Nampa and in newer parts of the city each bring local code requirements and an inspection order the plan must fit. We build semi-custom homes design-build. In Nampa you get a line-item budget, written progress reports weekly, and a written warranty covering our workmanship. Book the free planning consultation for a Nampa semi-custom home, or let the estimator work out a planning range first.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Nampa?",
          answer: "Nampa prices line up with the wider Treasure Valley. Across the valley in 2026, semi-custom homes plan between $225 and $300 for each square foot of finished space, land excluded. After a walk of your lot, we price that site in a line-item budget.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "We begin a semi-custom home from an engineered plan that already exists and modify it; a fully custom one starts with a blank page. Semi-custom gets you there sooner with a tighter budget band, while full custom leaves layout and massing entirely up to you.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "No. A Nampa semi-custom home gets the same framing, envelope, and mechanical systems, built to the same workmanship standards, as our fully custom work. The only difference is that more of the design is done before you start.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Yes. We build in Nampa often and out into the rest of Canyon County, and local plan review steps and impact fees are routine for us on a semi-custom home.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Nampa?",
          answer: "Get a planning range from our online estimator, then come see us for a free planning consultation, bringing the changes you'd want. If you have a parcel in mind, we'll go see it with you and show what drives its site work.",
        },
        {
          question: "Do semi-custom plans fit Nampa's older neighborhoods?",
          answer: "They can, with adjustment. Nampa's housing spans decades: Census ACS 2020\u20132024 estimates show about 26% of homes built before 1980 and around 22% built in 2010 or later, with a median year built of 2000. Lots in older areas may need a plan narrowed or reoriented, which is part of the modification work.",
        },
      ],
    },
    "eagle": {
      intro: "Semi-custom homes work well in Eagle, where much of the housing is recent and detached. A plan for a lot by Banbury, or elsewhere in town, is adjusted so it meets the city's requirements and passes each inspection in turn. Semi-custom homes are design-build with us, so changes to the plan are priced on an itemized budget, written updates come weekly, and our workmanship carries a written warranty. Try the estimator for a first planning range on an Eagle semi-custom home, or book a free planning consultation to go through plan changes.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Eagle?",
          answer: "Eagle pricing follows the overall Treasure Valley market. Semi-custom homes across the valley are budgeted at $225\u2013$300 for each finished square foot this year, land not included. Once we've walked your lot, you'll have a line-by-line budget for it.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "Semi-custom takes an engineered plan that already exists and modifies it; custom begins with a blank sheet. Semi-custom wins on speed and keeps the budget band narrower, while full custom puts complete control of layout and massing in your hands.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "No, it isn't. Our framing, envelope, mechanical systems, and workmanship standards stay the same. The only difference is how much of the design is done in advance.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "Yes. Semi-custom work in Eagle is common for us, as it is around Ada County, and we take care of the plan review and impact fees. Inside Eagle, the city's Building Division issues permits.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Eagle?",
          answer: "Our estimator gives you a first planning range, and a free planning consultation turns it into a plan; bring the plan you like. For a lot under consideration, we walk the site with you and call out what drives the site costs.",
        },
        {
          question: "How much of Eagle's housing is new?",
          answer: "A large share. Roughly 43% of Eagle homes date from 2010 or later in the Census Bureau's 2020\u20132024 ACS figures; 86% are detached single-family houses, and the typical home was built around 2007. That makes proven, recently engineered plans a good match for many Eagle lots.",
        },
      ],
    },
    "kuna": {
      intro: "Semi-custom homes fit Kuna's mostly single-family neighborhoods well. A plan adapted for a lot along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, or for any Kuna neighborhood, still has to fit local code and clear city inspections one after another. We work design-build, which means the semi-custom plan comes with a line-item budget, written updates each week, and workmanship backed by a written warranty. For a Kuna semi-custom home, the estimator shows a planning range, and we don't charge for the consultation where we plan it with you.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Kuna?",
          answer: "Kuna pricing moves with the broader Treasure Valley. Semi-custom homes in the valley are budgeting $225 to $300 per finished square foot for 2026, land excluded. After a walk of the lot together, you'll have an itemized budget for that parcel.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "Semi-custom modifies an existing engineered plan, while fully custom starts from a blank page. Choose semi-custom for a quicker build and a narrower budget band, or fully custom for complete control of layout and massing.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "It's the same build quality. A Kuna semi-custom home gets identical framing, envelope, and mechanical systems under the same workmanship standards as a custom one. It just starts with much of the design work behind it.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "Absolutely. Kuna sees our crews every week, and the rest of Ada County does too, so Kuna's review requirements and impact fees hold no surprises.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Kuna?",
          answer: "Use our estimator for a first planning range, and after that book a free planning consultation; photos, plans, and a list of what you'd change all help. For a lot you're considering, we'll tour it with you and flag which factors set its site costs.",
        },
        {
          question: "How new is Kuna's housing?",
          answer: "Very new. Kuna's typical home was built in 2008, per Census ACS 2020\u20132024 estimates, with about 15% of homes built in 2020 or later and 92% detached single-family houses. Semi-custom plans drawn for recent subdivision lots adapt readily to that setting.",
        },
      ],
    },
    "caldwell": {
      intro: "Semi-custom homes give Caldwell buyers a proven floor plan with room to personalize it. Whether the lot is along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, or in a Caldwell neighborhood, the adapted plan still has to satisfy city code and clear each inspection. The process is design-build: a budget itemized line by line, a written warranty covering workmanship, and a written update every week. For a first number, run the online estimator; to go deeper, schedule the free planning consultation.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Caldwell?",
          answer: "Caldwell budgets follow the larger Treasure Valley. Across the valley, 2026 semi-custom homes are budgeting roughly $225 to $300 per finished square foot, with land a separate cost. Once we walk the lot together, we put together a line-item budget for it.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "It comes down to where design begins. A full custom design begins on a blank page; semi-custom adapts a plan that's already engineered. You trade some control over layout and massing for a faster schedule and a narrower budget band.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "No difference in quality. Framing, envelope, mechanical systems, and workmanship are identical. The semi-custom home just starts with more of the design work done.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "Definitely. Our builds run year-round in Caldwell and the outlying parts of Canyon County, and our team knows how Caldwell reviews a semi-custom plan and which impact fees apply.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Caldwell?",
          answer: "A planning range comes first, from our estimator. A free planning consultation follows, covering scope, budget, and a few favorite plans. Then we walk the lot you're weighing with you so its site cost drivers are clear.",
        },
        {
          question: "Does Caldwell's mix of older and newer homes affect a semi-custom plan?",
          answer: "It can. Census ACS 2020\u20132024 estimates show about 29% of Caldwell homes were built before 1980 and roughly 32% in 2010 or later. Infill lots among older houses may call for a narrower or reoriented plan, while newer subdivisions usually accept a proven plan with fewer changes.",
        },
      ],
    },
    "star": {
      intro: "Semi-custom homes suit Star, where most houses are new, detached, and on subdivision lots. In Star River Ranch and the rest of Star, an adapted plan still has to meet local requirements and work through the city's inspections in order. A semi-custom home in Star is a design-build project, so you'll have an itemized budget for the plan, a written status note weekly, and our workmanship warranted in writing. Ask us for a free planning consultation on semi-custom options in Star, or get the estimator's planning range for the plan size you want.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Star?",
          answer: "Star prices line up with the general Treasure Valley market. Semi-custom homes in the valley carry a 2026 planning range of about $225\u2013$300 per square foot of finished house, without land. A walk of your site then produces an itemized budget for it.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "The semi-custom route takes a proven engineered plan and changes it to fit you; full custom starts from a blank page. The semi-custom path moves quicker and narrows the budget band, while fully custom gives you full control of layout and massing.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "No difference in quality. Structure, mechanical systems, envelope, and workmanship match exactly. Semi-custom simply starts with design work already behind it.",
        },
        {
          question: "Do you build in Star?",
          answer: "Absolutely. We're building semi-custom homes in Star on a regular basis, as well as in outlying Ada County, and we take care of Star's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Star?",
          answer: "Start with our estimator to see a planning range for a semi-custom home. Then book a free planning consultation, favorite plans in hand. For a lot you're considering, we'll walk the ground with you and point to whatever will drive its site costs.",
        },
        {
          question: "How recent is Star's housing stock?",
          answer: "Very recent. Census ACS 2020\u20132024 estimates show about 22% of Star's homes were built in 2020 or later and a median year built of 2011, with about 90% detached houses. Engineered plans developed for recent lots adapt well here.",
        },
      ],
    },
    "middleton": {
      intro: "Semi-custom homes match the way Middleton has grown, with many newer detached houses on subdivision lots. For Middleton Heights or another part of town, the adapted plan still needs to satisfy the city's requirements and its inspection sequence. Semi-custom work in Middleton runs design-build: the plan and its changes are priced line by line, progress is reported in writing every week, and our workmanship is warranted in writing. The estimator gives a semi-custom planning range for Middleton, and the first planning consultation is free.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Middleton?",
          answer: "Middleton prices mirror the wider Treasure Valley. Valleywide, semi-custom homes plan for 2026 at $225 up to $300 a finished square foot, and the land is extra. When we walk the lot in person, we write an itemized budget for that site.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "It comes down to where design begins. Fully custom begins on a blank page; a semi-custom home modifies an existing engineered plan. In exchange for less say over layout and massing, you get a quicker schedule and a tighter budget band.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "Not lower quality at all. Framing, envelope, mechanical systems, and workmanship match exactly. The semi-custom home just starts with design work already behind it.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "Yes. Our crews build semi-custom homes in Middleton regularly and in nearby Canyon County towns, and we're familiar with Middleton's review rules and impact fees.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Middleton?",
          answer: "Start with our estimator and its planning range, then pick a time for a free planning consultation and bring sketches or a plan you like. When a lot is under consideration, we'll tour it with you and identify where its site costs will come from.",
        },
        {
          question: "Who lives in Middleton's homes?",
          answer: "Mostly owners. Census ACS 2020\u20132024 estimates put Middleton's owner-occupancy at about 90%, with roughly 47% of homes built in 2010 or later; the median home dates to 2009. Owners building to stay often want a proven plan adjusted to their own lot and household.",
        },
      ],
    },
    "garden-city": {
      intro: "Semi-custom homes can work in Garden City when the plan is adjusted to the lot. Our team knows the review steps in Ada County, the impact fees, and the typical lot conditions here, and we modify the plan with those in mind. A semi-custom build in Garden City is design-build: the budget is itemized, a written progress report comes weekly, and a written warranty covers the work. Start with a free planning consultation about a semi-custom Garden City home, or check the planning range our estimator produces.",
      faqs: [
        {
          question: "How much does semi-custom homes cost in Garden City?",
          answer: "Garden City pricing tracks the overall Treasure Valley. In 2026, semi-custom homes in the valley plan at roughly $225 to $300 for every square foot of finished space, before land. A lot walkthrough then yields an itemized budget for that lot.",
        },
        {
          question: "What is the difference between semi-custom and fully custom?",
          answer: "The semi-custom route starts from a proven engineered plan and adapts it; full custom starts with nothing on paper. Semi-custom saves time and narrows the budget band, and fully custom hands you full control of layout and massing.",
        },
        {
          question: "Is a semi-custom home lower quality than a custom home?",
          answer: "Same quality, start to finish. A semi-custom house uses the same framing, envelope, and mechanical systems, held to the same workmanship standards, as fully custom work. Part of the design simply comes already done.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "Absolutely. Garden City semi-custom builds are common for us, and so are builds elsewhere in Ada County; we know the city's review steps and impact fees. Garden City's building department reviews permits inside city limits.",
        },
        {
          question: "How do I get a budget for semi-custom homes in Garden City?",
          answer: "To begin, our online estimator will give you a planning range. Your free planning consultation comes after, ideally with a few plans you like in hand. When you're weighing a lot, we'll walk it with you and show what moves its site costs most.",
        },
        {
          question: "What kind of housing surrounds a Garden City lot?",
          answer: "A mix. Only about 51% of Garden City homes are detached single-family houses in Census ACS 2020\u20132024 estimates, with roughly 14% mobile or manufactured homes, 13.5% attached houses, and 22% in buildings of two or more units. A semi-custom plan often needs reworking for lot width and neighbors.",
        },
      ],
    },
  },
  "home-plans-design": {
    "boise": {
      intro: "Need home design and plans in Boise? Houses near the North End and throughout Boise must be drawn to local building requirements and to an inspection schedule the city sets, and our drawing sets are prepared with that in mind. When the plans lead to a build, the same design-build team carries them through. You'll get a line-item budget tied to the drawings, a weekly update in writing, and our workmanship under written warranty. For Boise plans, a free planning consultation is the first step, or you can get a planning range from the estimator before deciding.",
      faqs: [
        {
          question: "How much does home design & plans cost in Boise?",
          answer: "Boise design fees follow the broader Treasure Valley market. In 2026, a full custom home plan set that is ready for permit, including the structural engineering and the energy compliance work, costs roughly $9,000 to $35,000 here, which works out to roughly 5\u201312% of the build cost. After we walk your lot, the site gets its own itemized budget.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "Yes. The finished drawings belong to you, and any licensed contractor can build from them. We would like to be the one you choose, but the plans are yours whether or not we build the house.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "You can. A stock plan isn't drawn for your Boise lot, though, and it almost always needs structural engineering specific to Idaho, energy compliance work, and a foundation adapted to the site before a county or city will permit it. Count that rework when you compare costs.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes. Boise work is routine for us, and so is work across Ada County, so our drawings are prepared with Boise's plan review and impact fees in mind.",
        },
        {
          question: "How do I get a budget for home design & plans in Boise?",
          answer: "See what the estimator gives as a planning range for design and plans, then book the free planning consultation. If you're weighing a particular Boise lot, we'll walk it together and list what will drive the site costs, which shapes the drawings too.",
        },
        {
          question: "Do plans for a Boise historic district need extra review?",
          answer: "They can. For property in a Boise historic district, the homeowner guide calls for a Certificate of Appropriateness from Planning covering exterior work such as windows and siding and that approval comes before the building permit application. If your lot is in one, the drawings go through that step first.",
        },
      ],
    },
    "meridian": {
      intro: "Home design and plans for Meridian lots start with the site. Plans for a house near Lochsa Falls, or anywhere in Meridian, have to answer to local building requirements and the inspection sequence, and we draw them that way. When we also build, our design-build terms apply: weekly progress in writing, a written warranty for workmanship, and a budget priced item by item. The estimator offers a planning range, or you can book a free consultation.",
      faqs: [
        {
          question: "How much does home design & plans cost in Meridian?",
          answer: "In Meridian, design costs follow the Treasure Valley market. A custom home drawing set that's ready for permit, structural engineering and energy compliance included, runs roughly $9,000 to $35,000 here as of 2026, or around 5 to 12 percent of the construction cost. Walk the lot with us for a budget itemized to your site.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "Yes, they're yours. You own the finished drawings and can hand them to any licensed contractor to build. We hope you'll pick us, but ownership of the plans doesn't depend on it.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "It's possible. But a stock plan wasn't drawn for your Meridian lot, and it nearly always needs Idaho structural engineering, energy compliance, and a foundation fitted to the site before it can be permitted. Include that rework when you weigh the price.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. We build in Meridian constantly and across Ada County, and the plan sets we draw here are prepared for Meridian's review and impact fees.",
        },
        {
          question: "How do I get a budget for home design & plans in Meridian?",
          answer: "Get a planning range for design and plans from the estimator, and then book a free planning consultation. If there's a Meridian lot you're weighing, we'll walk it with you and describe the conditions that will affect site costs and the design.",
        },
        {
          question: "Where do Meridian plans get submitted?",
          answer: "Inside city limits, Meridian's Building Services division at 33 E. Broadway Ave. issues the permits, and applications go in online through the Citizen Access portal. Our permit-ready drawing sets are prepared for that submittal.",
        },
      ],
    },
    "nampa": {
      intro: "Home design and plans for Nampa start with the lot and the code. Whether you're near Downtown Nampa or elsewhere in town, drawings must line up with local building requirements and the inspection sequence. The drawings are one stage of a design-build process. Nampa owners get an itemized budget, written progress reports each week of construction, and workmanship backed by a written warranty. Talk through your Nampa plans at a free planning consultation, or get a sense of cost with the estimator's planning range.",
      faqs: [
        {
          question: "How much does home design & plans cost in Nampa?",
          answer: "Nampa pricing lines up with the wider Treasure Valley. As of 2026, a permit-ready drawing set for a custom home, including structural engineering and energy compliance, costs about $9,000 to $35,000, roughly 5 to 12 percent of construction. After we walk the property, you get a line-item budget for that site.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "Yes. The drawings are your property once they're finished, and you can build from them with any licensed contractor. We'd like to be that builder, but the plans belong to you regardless.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "Yes, but nobody drew that stock plan with your Nampa lot in mind. It usually needs Idaho structural engineering, an energy compliance package, and a site-specific foundation before the city or county will permit it, so add that rework to the comparison.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Yes. We take on Nampa projects regularly, plus work in outlying parts of Canyon County, and our drawings anticipate Nampa's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for home design & plans in Nampa?",
          answer: "Begin with the estimator's planning range for home plans. Then request your free planning consultation, with the lot address handy. For a lot you're considering, we'll meet you there, walk it, and explain what its site work will hinge on.",
        },
        {
          question: "How deep do Nampa foundations have to go?",
          answer: "Nampa's residential FAQ sets frost depth at 24 inches. Footings on a new home are drawn to at least that depth, and the engineer sizes them for the soils on your lot, which is one reason a site-adapted foundation is part of every plan set we prepare.",
        },
      ],
    },
    "eagle": {
      intro: "Home design and plans in Eagle, including Banbury have to suit the lot and the code at the same time. Drawings for a home in Eagle are prepared around the city's building requirements and the inspections that come with them. Drawing and building under one design-build roof means the plans and the budget move together. In Eagle you'll get an itemized cost list, a written progress report weekly once we're building, and our workmanship warranted in writing. Book a free planning consultation to start your Eagle plans, or request a quote for the home the drawings describe.",
      faqs: [
        {
          question: "How much does home design & plans cost in Eagle?",
          answer: "Eagle costs run with the general Treasure Valley market. For 2026, a custom home plan set that's ready to permit, with the structural engineering and energy compliance work included, typically costs $9,000 to $35,000 in this valley, about 5 to 12 percent of what the home costs to build. Once we've walked your site, we write an itemized budget for it.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "Yes, without conditions. You can take the drawings to whichever licensed contractor you like for construction. Of course we'd like to build it, but the plans are yours either way.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "You could, but a stock plan isn't designed for your site and will nearly always require a site-adapted foundation, energy compliance, and Idaho structural engineering before a county will issue a permit. Include the rework when you compare.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "Yes. Our team builds in Eagle year-round and elsewhere in Ada County, and our drawing sets are prepared with Eagle's review steps and impact fees in view.",
        },
        {
          question: "How do I get a budget for home design & plans in Eagle?",
          answer: "Start with the estimator for a planning range, then request a free planning consultation; bring photos or any plans you've started. If there's a lot in mind, we'll walk the site with you and spell out which factors set its site costs.",
        },
        {
          question: "What code are Eagle house plans drawn to?",
          answer: "The City of Eagle Building Division enforces the 2018 International Residential Code for residential work. Our Eagle drawing sets are prepared to that edition, along with the structural engineering and energy compliance the city expects at submittal.",
        },
      ],
    },
    "kuna": {
      intro: "Good Kuna house plans begin with what the city asks to see. Drawings for a house near Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, or anywhere else in Kuna, are prepared for local building requirements and the inspection sequence that follows. Our plans feed straight into design-build construction, so Kuna owners get an itemized budget, a written report every week of the build, and a written warranty behind our workmanship. Start with a free planning consultation about Kuna plans, or let the estimator give an early planning range on cost.",
      faqs: [
        {
          question: "How much does home design & plans cost in Kuna?",
          answer: "Kuna budgets track the overall Treasure Valley. In 2026, a permit-ready custom home plan set, its structural engineering and energy compliance finished, is about $9,000\u2013$35,000 across the region, or 5\u201312% of construction cost. After we walk your parcel, an itemized budget for it follows.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "Yes, the plans are yours. Once they're finished, any licensed contractor can build from them. We'd be glad to be that builder, but ownership doesn't depend on it.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "Catalog plans look cheaper, but they're not drawn for your lot. Expect a county to need an energy compliance path, a site-adapted foundation, and Idaho structural engineering before issuing a permit. Add the rework to the comparison.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "Definitely. We build in Kuna regularly, and elsewhere in Ada County, and we draw plans knowing what Kuna's reviewers look for and which impact fees apply.",
        },
        {
          question: "How do I get a budget for home design & plans in Kuna?",
          answer: "Begin with the online estimator's planning range, then sit down for a free planning consultation and bring any plans you've started. Name the parcel and we'll walk it with you and explain its site cost drivers.",
        },
        {
          question: "What does Kuna require in a new-home plan submittal?",
          answer: "Kuna's digital submittal instructions ask for the permit application, site and floor plans, Manual J loads, a ResCheck report if the home skips the prescriptive energy path, and structural calcs where needed. Our Kuna plan sets include those pieces, and the approved plans must stay on site during construction.",
        },
      ],
    },
    "caldwell": {
      intro: "Home design and plans for Caldwell need to be ready for a quick review. A drawing set for a lot along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, or any Caldwell address, is prepared around city code and the inspection steps after it. When the plans lead to a build, we carry them through design-build: a budget itemized against the drawings, a written note each week, and workmanship we warrant in writing. Our estimator can put a planning range on a Caldwell project, and there's no charge for the first planning consultation about your plans.",
      faqs: [
        {
          question: "How much does home design & plans cost in Caldwell?",
          answer: "Caldwell budgets run with the general Treasure Valley. Permit-ready plans for a custom home, with the structural engineering and energy compliance done, cost about $9,000\u2013$35,000 valleywide as of 2026, approximately 5\u201312% of construction cost. Set up a lot walkthrough and we'll prepare a line-item budget for that parcel.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "Yes, completely. When the drawings are done, a licensed contractor of your choice is free to build from them. Naturally we'd like to build it, but that doesn't change who owns the plans.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "That's an option, but remember no one sized it for your parcel. To get it permitted, you'll nearly always add a foundation adapted to your site, Idaho-specific structural engineering, plus energy compliance. Price that rework into your comparison.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "Yes. We build in Caldwell year-round and throughout Canyon County, and every plan set we draw there accounts for the city's review rules and impact fees.",
        },
        {
          question: "How do I get a budget for home design & plans in Caldwell?",
          answer: "Get a planning range for your plans from the estimator, then arrange a free planning consultation. If you're eyeing a lot in Caldwell, we walk it together and point out which factors set its site costs.",
        },
        {
          question: "How fast does Caldwell review a complete set of plans?",
          answer: "Per Caldwell's residential permit packet, a complete submittal of plans and supporting documents should clear plan review within 5 to 7 working days. That makes a complete, coordinated drawing set especially valuable in Caldwell; an incomplete one simply waits.",
        },
      ],
    },
    "star": {
      intro: "Home design and plans in Star need to be ready for the city's online submittal. Plans for a Star River Ranch lot, or any Star address, are drawn to the city's code and the inspections that come after. We draw and build design-build, so your Star plans come with an itemized budget, written updates weekly on site, and a written warranty covering our work. Get a planning range from the estimator, or book the free planning consultation to start on your Star plans.",
      faqs: [
        {
          question: "How much does home design & plans cost in Star?",
          answer: "Star pricing follows the general Treasure Valley picture. This year, drawings for a custom home that are ready for permit, including structural engineering and energy compliance, typically cost from $9,000 up to $35,000 across the region, roughly 5 to 12 percent of construction cost. Arrange a walkthrough of the lot to get a line-item budget for your site.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "Yes, without conditions. Any licensed contractor can build from the drawings. We'd welcome the chance to build, but the plans are yours no matter what.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "Sure, you can, but keep in mind the plan wasn't drawn for your lot. Before it's permit-ready, you'll nearly always add site-specific foundation work, Idaho-specific structural engineering, plus energy compliance. That rework belongs in the math.",
        },
        {
          question: "Do you build in Star?",
          answer: "We do. We work in Star often and in other Ada County towns, and the drawings we prepare for Star account for its plan review and impact fees.",
        },
        {
          question: "How do I get a budget for home design & plans in Star?",
          answer: "Lead with our free estimator, which returns a planning range. Next, request the free planning consultation; it helps to share the address. For a lot you might buy, we'll tour it with you and identify the conditions that drive its site costs.",
        },
        {
          question: "How are plans submitted in Star?",
          answer: "Star's residential submittal checklist requires all plans to be submitted and uploaded through the city's iWorQ portal. Our Star drawing sets are prepared as complete digital files ready for that upload, along with any required soils report or sewer certificate.",
        },
      ],
    },
    "middleton": {
      intro: "Home design and plans for Middleton are drawn to the codes the city has adopted. A plan for Middleton Heights, or any other Middleton lot, has to answer to that code and to the inspections that follow permit issuance. Plans we draw stay with the same design-build team through construction, with a line-item budget, a weekly written update, and a written workmanship warranty. Our estimator returns a planning range in minutes, and the planning consultation for Middleton plans is free.",
      faqs: [
        {
          question: "How much does home design & plans cost in Middleton?",
          answer: "Middleton costs track the larger Treasure Valley. In 2026, permit-ready custom home drawings with structural engineering and energy compliance typically run $9,000 to $35,000 regionally, or about 5\u201312 percent of construction cost. A lot walkthrough then produces an itemized budget for that parcel.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "You do. You own the drawings and they can be built by any licensed contractor. We hope you'll choose us to build, but the plans remain yours whatever you decide.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "Online plans seem simple, but they're not drawn for your lot. A county will nearly always require energy compliance, a foundation fitted to the lot, and structural engineering specific to Idaho before issuing a permit. Count the rework before you decide.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "We do. Our team builds in Middleton all the time and across Canyon County, and our drawings account for Middleton's plan review steps and impact fees.",
        },
        {
          question: "How do I get a budget for home design & plans in Middleton?",
          answer: "Our estimator gives a planning range for plans and design; next, reserve your free planning consultation. Once a lot is in the picture, we'll walk it with you and describe what its site work will involve.",
        },
        {
          question: "Which building codes does Middleton use?",
          answer: "Middleton's Building Department lists the 2018 International Residential Code, the 2018 International Energy Conservation Code with state amendments, the 2023 National Electrical Code with state amendments, and the 2017 Idaho State Plumbing Code among its adopted codes. Our drawings are prepared to those editions.",
        },
      ],
    },
    "garden-city": {
      intro: "Garden City plan sets have to satisfy the city's design review as well as the building code. Our drawings reflect what we know about plan review in Ada County, impact fees, and conditions common to Garden City lots. We draw plans as part of design-build, so the Garden City budget is itemized while the drawings take shape. During construction you get written weekly updates and, at the end, a written warranty on the workmanship. Request a free planning consultation about drawings for a Garden City home, or see the planning range our estimator works out.",
      faqs: [
        {
          question: "How much does home design & plans cost in Garden City?",
          answer: "Garden City prices mirror the broader Treasure Valley. A custom home's permit-ready plans, structural engineering and energy compliance included, generally cost about $9,000\u2013$35,000 in the Treasure Valley this year, around 5 to 12 percent of construction cost. Once we've walked your site, the line-by-line budget follows.",
        },
        {
          question: "Do I own the plans when they are finished?",
          answer: "They are. Any licensed contractor you choose can build from the drawings. We'd like to earn the build, but the plans are yours either way.",
        },
        {
          question: "Can I buy a stock plan online instead?",
          answer: "That's an option, but remember it was drawn for someone else's site. Before it can be permitted, you'll nearly always add a foundation reworked for the lot, engineering to Idaho structural standards, and an energy compliance package. That rework belongs in the math.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "Yes, we do. We work in Garden City regularly and throughout Ada County, and we draw plan sets with the city's review and impact fees in mind.",
        },
        {
          question: "How do I get a budget for home design & plans in Garden City?",
          answer: "Start with our online estimator to see a planning range. Next, sign up for a free planning consultation and list the rooms you need. With a lot in view, we'll walk the site with you and explain what its site work will involve.",
        },
        {
          question: "Does Garden City review the design as well as the structure?",
          answer: "Yes. Garden City's residential permit page lists structural review and a design compliance review and inspection among the typical fees for a new home. Our plan sets are prepared to clear both, which avoids rework after submittal.",
        },
      ],
    },
  },
  "build-on-your-lot": {
    "boise": {
      intro: "Own a lot in Boise and want to build on it? Lots near the North End and across the city come with their own local requirements and inspection steps, and the layout of the house has to answer to them. Once the lot checks out, we take the house design-build. Every cost sits on its own budget line, you hear from us in writing weekly, and our workmanship is covered by a written warranty. To get going, tell the estimator roughly how big a house you want and it will return a planning range, or book the free planning consultation and bring the parcel details.",
      faqs: [
        {
          question: "How much does build on your lot cost in Boise?",
          answer: "Build-on-your-lot pricing in Boise follows the Treasure Valley market as a whole. In 2026, vertical construction on land you already own is budgeted at $225\u2013$400 for each finished square foot, with site work carried as its own budget line. A lot walkthrough gives you a line-item budget specific to the parcel.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "Plan on $225 to $400 per finished square foot for the vertical construction in 2026, with site work separate and highly variable. On a serviced lot in a Meridian subdivision, figure $25,000 to $50,000 of it; on rural acreage where a well, septic, and access must be added, $80,000 to $150,000 is possible.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "We check six things: the soils, access to utilities, legal access, setbacks, slope, and whether the land is in a floodplain. All six get reviewed before any design work on your Boise parcel, and if the land is not worth building on, we will say so.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes. Our crews work in Boise regularly and all over Ada County, and we know the local plan review steps and impact fees that come with a new house on an existing lot.",
        },
        {
          question: "How do I get a budget for build on your lot in Boise?",
          answer: "The estimator gives you a first planning range. After that comes a free planning consultation, and if you own the Boise lot or are considering one, we tour it together and explain which site conditions carry the cost.",
        },
        {
          question: "Does it matter whether my lot is inside Boise city limits?",
          answer: "Yes. Within the city boundary, a new house is permitted by Boise's own planning and development staff. Land beyond that boundary is handled by Ada County, which runs a separate review. We confirm which one applies before design begins.",
        },
      ],
    },
    "meridian": {
      intro: "Already own land in Meridian? Building on your lot here still means matching the house to local building requirements and the city's inspection schedule, from Lochsa Falls to the edges of town. As a design-build firm we keep it under one contract with a line-by-line budget, written weekly updates, and a workmanship warranty in writing. Tell the estimator about the home you picture on your Meridian lot and it returns a planning range; for a deeper look, reserve a free planning consultation.",
      faqs: [
        {
          question: "How much does build on your lot cost in Meridian?",
          answer: "Meridian tracks the Treasure Valley as a whole on price. For 2026, building the house itself on a lot you own is planned around $225\u2013$400 for every finished square foot, while site work gets its own separate budget. Walk the lot with us for an itemized budget written for that parcel.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "For 2026, the house itself plans at $225\u2013$400 a finished square foot; site work is priced apart from that and swings widely. Here in Meridian, a serviced subdivision lot might call for site work in the $25,000\u2013$50,000 range, whereas rural acreage that requires a well, septic, and access can reach $80,000 to $150,000.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "It depends on six factors: soils, utilities you can reach, legal access to the parcel, setbacks, slope, and floodplain status. Every one is checked before design starts on your Meridian land, and if the parcel isn't worth building on, you'll hear that from us.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. Our office is here, Meridian lots are a regular part of our work, and so are parcels across Ada County; plan review and impact fees for a new house on an existing lot are familiar territory.",
        },
        {
          question: "How do I get a budget for build on your lot in Meridian?",
          answer: "The online estimator gives a first planning range, and the free planning consultation follows. Bring your Meridian lot, or one you're thinking about, and we'll walk it together to identify the main site cost drivers.",
        },
        {
          question: "What impact fees apply to a new Meridian home?",
          answer: "Meridian's impact fees scale with the home's climate-controlled floor area. For a house of 1,701 to 2,500 sq ft, the city's fee schedule shows $995 for fire, $4,119 for parks, and $402 for police. A larger or smaller home falls in a different bracket, so we confirm the numbers when the plan is set.",
        },
      ],
    },
    "nampa": {
      intro: "Building on your own lot in Nampa? Whether the parcel is near Downtown Nampa or out toward the edges of town, the house still has to follow local code and the city's inspection schedule. The house goes up design-build, one team accountable for it. We price it item by item, send a written progress update weekly, and put our workmanship warranty on paper. Book a free planning consultation about the land you own in Nampa, or try the estimator if a planning range would help you think it through first.",
      faqs: [
        {
          question: "How much does build on your lot cost in Nampa?",
          answer: "Nampa budgets track the broader Treasure Valley. In 2026, building the home on land you own is planned at $225 to $400 for each finished square foot, and site work is carried as its own budget item. Once we walk the parcel with you, we write a line-by-line budget for it.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "For 2026, budget the house itself at $225\u2013$400 per finished square foot. Site costs come on top and vary a great deal: a serviced lot in a Meridian subdivision could need $25,000 to $50,000 in site work, while raw rural ground that needs its own well, septic, and access drive might run $80,000 to $150,000. Nampa parcels fall all along that range.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "Soils, legal access, utility access, slope, setbacks, and floodplain status decide it. We work through all six before any design begins on your Nampa parcel, and we will tell you plainly if it isn't worth building on.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Yes. We work in Nampa regularly and in the neighboring Canyon County communities, so plan review and impact fees for a house on an existing lot there are familiar.",
        },
        {
          question: "How do I get a budget for build on your lot in Nampa?",
          answer: "Our online estimator gives the first planning range. Next is a free planning consultation about a home on your lot; bring any survey you have. We'll also walk the lot with you and pin down what will drive its site costs.",
        },
        {
          question: "Does a Nampa lot outside city limits go through the city?",
          answer: "No. Inside Nampa city limits, Development Services reviews building permits; unincorporated parcels nearby go through Canyon County instead. Knowing which one applies matters for review times and fees, so we confirm it before design.",
        },
      ],
    },
    "eagle": {
      intro: "Have land in Eagle and want a house on it? Including Banbury, a home on your own lot still has to be laid out for Eagle's building requirements and the inspection steps that follow. It's one design-build contract covering the house on your lot: an itemized budget, a written update each week, and our workmanship warranty in writing. Bring your Eagle lot's details to a free planning consultation, or request a quote for the home you are picturing.",
      faqs: [
        {
          question: "How much does build on your lot cost in Eagle?",
          answer: "Eagle budgets track the larger Treasure Valley market. This year, a house on land you already hold has a planning range of $225 to $400 a finished square foot, with site work kept in a budget of its own. A walk of the lot with us produces an itemized, line-by-line budget for that parcel.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "Plan on $225\u2013$400 per finished square foot for the house in 2026, with site work as a separate number that swings widely: roughly $25,000\u2013$50,000 for a serviced lot in a Meridian subdivision versus $80,000\u2013$150,000 for rural acreage needing a well, septic, and access.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "Six factors decide it, and we check all of them up front: soils, slope, setbacks, legal access, utility access, and floodplain status. When a lot isn't worth building on, we say so plainly.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "We do. Eagle lots are regular work for us, along with neighboring Ada County communities, and we've been through Eagle's plan review steps and impact fees many times.",
        },
        {
          question: "How do I get a budget for build on your lot in Eagle?",
          answer: "The estimator sets a planning range, which a free planning consultation then narrows; bring any survey you have. On a lot you're considering, we walk the site with you and pick out which conditions will drive the site costs.",
        },
        {
          question: "Does Eagle offer wildfire guidance for foothills lots?",
          answer: "Yes. The City of Eagle Building Division links homeowners to \"Living with Fire: A Guide for the Homeowner\" for protecting homes in Firewise communities and areas. On a foothills lot we discuss defensible space and material choices during design, using that guidance as a starting point.",
        },
      ],
    },
    "kuna": {
      intro: "Own a lot in Kuna? Whether it's near Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, or on a larger parcel outside the center of town, the home you build has to suit Kuna's building requirements and its inspection steps. Your land, our design-build crew: costs are broken out line by line, a written update keeps you current every week, and the work carries a written warranty. The estimator will rough out a planning range for a home on your Kuna acreage, and a free planning consultation is the next step when you want to talk specifics.",
      faqs: [
        {
          question: "How much does build on your lot cost in Kuna?",
          answer: "Kuna pricing moves with the wider Treasure Valley. For 2026, the house on your own lot runs around $225\u2013$400 for every square foot of finished living space, with site work budgeted separately. A walk-through of your lot then produces an itemized budget for the property.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "The house is the predictable part, at roughly $225\u2013$400 per finished square foot this year. Site work is the variable, running $25,000 to $50,000 on a serviced Meridian subdivision lot and $80,000 to $150,000 on rural acreage that needs a well, septic, and access.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "Soils come first, followed by legal and utility access, slope, setbacks, and floodplain status. We check all six before design begins, and if a parcel isn't worth building on, we say so.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "We do. Building on owners' lots in Kuna is regular work for us, as it is in other Ada County towns, and we understand Kuna's plan review and impact fees well.",
        },
        {
          question: "How do I get a budget for build on your lot in Kuna?",
          answer: "Use the estimator first for a planning range on a home on your own lot. After that, book a free planning consultation, questions in hand. Already found a lot? We'll walk the site with you and point out what will drive its site costs.",
        },
        {
          question: "When is the best time for site work in Kuna?",
          answer: "Summer is usually driest. A volunteer CoCoRaHS gauge just south-southeast of town averages, in NOAA's 1991\u20132020 normals, about 0.29 inches in July and 0.22 in August, against 1.55 in December and 1.35 in January. We schedule excavation and foundations with that pattern in mind.",
        },
      ],
    },
    "caldwell": {
      intro: "Building on land you own in Caldwell? From lots along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, out to rural parcels, the home has to be planned around Caldwell's code and inspection steps. From the lot review to the final walkthrough it's one design-build contract. The budget lists each cost separately, and a written report reaches you every week. When the house is done, a written warranty stands behind the workmanship. Most owners begin with a free planning consultation about their Caldwell parcel; if you'd rather see a number first, the estimator turns a few answers into a planning range.",
      faqs: [
        {
          question: "How much does build on your lot cost in Caldwell?",
          answer: "Caldwell pricing tracks the wider Treasure Valley. In 2026, the house on an owner's lot plans in a band from $225 up to $400 per finished square foot, while site work gets a budget line of its own. When we've walked your site, we deliver an itemized budget for it.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "For 2026, the structure itself runs $225 to $400 per finished square foot of house. The site is priced separately and can vary a great deal. In a Meridian subdivision with services at the lot, $25,000\u2013$50,000 is typical; acreage that still needs a well, septic, and an access drive can reach $80,000\u2013$150,000.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "Our review covers six things up front: setbacks, slope, soils, legal access, utility access, and floodplain status on your Caldwell parcel. If the land isn't worth building on, you'll hear that plainly.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "Yes. Our team builds on owners' lots in Caldwell often, and across greater Canyon County, so the city's plan review steps and impact fees for that kind of project are familiar.",
        },
        {
          question: "How do I get a budget for build on your lot in Caldwell?",
          answer: "Start with the estimator's planning range, then meet us for a free planning consultation; bring any survey you have. We walk lots in person, so bring us the one you're considering and we'll point out the conditions behind its site costs.",
        },
        {
          question: "Does an unplatted Caldwell parcel take longer to permit?",
          answer: "Yes. Caldwell's residential permit packet notes that parcels not part of a platted subdivision take longer to review than the usual 5 to 7 working days, and a lot in a designated flood plain needs a flood plain certificate. We check both before design so the schedule reflects them.",
        },
      ],
    },
    "star": {
      intro: "Got land in Star already? Near Star River Ranch or on open acreage, the house needs a design that suits Star's code and its inspection steps. We work design-build on owners' lots, so the budget is itemized down to the line, a written update arrives weekly, and your house comes with a written workmanship warranty. If you want a number before we meet, the estimator gives a planning range for building on your Star parcel; otherwise, book a free planning consultation.",
      faqs: [
        {
          question: "How much does build on your lot cost in Star?",
          answer: "Star costs run with the larger Treasure Valley market. On land you already own, the house plans in 2026 at about $225 to $400 a finished square foot, and the site work is budgeted on its own. When we walk the lot together, we deliver an itemized budget for it.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "This year the house itself plans at $225\u2013$400 for each square foot of finished space. Site work sits outside that, and the range is huge: a serviced Meridian subdivision lot may call for $25,000\u2013$50,000, whereas rural acreage without a well, septic, or access yet can cost $80,000\u2013$150,000.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "Soils lead the list, then utility access and legal access, setbacks, slope, and whether the lot is in a floodplain. We review all six before design starts. If the lot isn't worth building on, we'll tell you.",
        },
        {
          question: "Do you build in Star?",
          answer: "We do. Star lots come our way often, as do parcels in neighboring Ada County communities, and we know how Star handles plan review and impact fees.",
        },
        {
          question: "How do I get a budget for build on your lot in Star?",
          answer: "Begin with our free estimator and its planning range, then arrange the free planning consultation; bring your parcel number. For any Star lot on your shortlist, we'll walk the site with you and identify what the site work will hinge on.",
        },
        {
          question: "Does a Star lot need a sewer and water letter?",
          answer: "Usually. Star's residential submittal checklist requires a sewer certificate from Star Sewer & Water for a new home unless the home will be on septic. We confirm service availability for your lot early, because it affects both the permit and the site work budget.",
        },
      ],
    },
    "middleton": {
      intro: "Have a lot in Middleton? Near Middleton Heights or out on a larger Canyon County parcel, the house you put on it still has to suit local building requirements and the inspection steps that apply. Because we design and build the house ourselves, the price for your parcel is itemized, progress is reported to you in writing once a week, and a written warranty covers the workmanship. A planning range for a house on your Middleton land is a few clicks away in the estimator, and the first planning consultation costs nothing.",
      faqs: [
        {
          question: "How much does build on your lot cost in Middleton?",
          answer: "Middleton prices follow the larger Treasure Valley market. The house on a lot you own is budgeted for 2026 at $225\u2013$400 a square foot of finished area, and the site work is figured on its own. Book a lot walkthrough and receive a line-by-line budget specific to your site.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "Plan on a range of $225 to $400 per square foot of finished house in 2026. Site work is separate and depends heavily on the parcel. A Meridian subdivision lot with services already in might need $25,000\u2013$50,000; rural ground needing a well, septic, and an access drive, $80,000\u2013$150,000.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "We check six things before design starts: soils, slope, setbacks, utility access, legal access, and floodplain status. If a parcel isn't worth building on, we'll tell you.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "Yes. We're building on Middleton lots often and across greater Canyon County, and we've taken plenty of houses through Middleton's review and impact fee process. In town, the City of Middleton Building Department issues permits.",
        },
        {
          question: "How do I get a budget for build on your lot in Middleton?",
          answer: "Our online estimator gives a planning range, and the next step is a free planning consultation, so have your parcel number handy. Got land in mind? We walk it together and point out what moves its site costs most.",
        },
        {
          question: "How do I know if my lot is inside Middleton city limits?",
          answer: "Middleton's Building Department points applicants to the Canyon County Assessor's web map to verify a permit address or parcel. If the lot is inside the city, permits go through Middleton's Citizenserve portal; if not, Canyon County handles them. We confirm this before design.",
        },
      ],
    },
    "garden-city": {
      intro: "Building on your own lot in Garden City? Ada County plan review, impact fees, and Garden City lot conditions are familiar to us, and the house gets designed around all of them. Garden City infill lots can be tight, and one design-build team keeps the house and the site in the same plan. Expect an itemized budget, a short written note on progress weekly, and a written guarantee on our craftsmanship. Bring your Garden City address along to a free planning consultation, or request a quote with the basics right away.",
      faqs: [
        {
          question: "How much does build on your lot cost in Garden City?",
          answer: "Garden City budgets move with the wider Treasure Valley market. This year, the house on your own Garden City lot is figured at $225 to $400 per finished square foot; site work sits in a separate budget. Have us walk your lot and you'll get an itemized budget for that parcel.",
        },
        {
          question: "What does it cost to build on land I already own?",
          answer: "Expect two budgets. In 2026 the house itself runs $225\u2013$400 per finished square foot. Site work is a separate budget with an enormous spread: a serviced lot inside a Meridian subdivision might total $25,000\u2013$50,000 of it, and rural acreage still lacking a well, septic, and access can take it to $80,000\u2013$150,000.",
        },
        {
          question: "How do I know if my lot is actually buildable?",
          answer: "It depends on six things: legal access, utilities, soils, slope, setbacks, and floodplain status. All six get checked before any design work, and we'll tell you when a lot isn't worth building on.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "Definitely. We're on site in Garden City year-round and around the wider Ada County area, and we've taken owner-lot builds through Garden City's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for build on your lot in Garden City?",
          answer: "Begin with the online estimator; it gives a planning range. When you're ready, set up a free planning consultation, and share the plat if you have it. With a lot in view, we walk it together and spell out where its site costs will come from.",
        },
        {
          question: "Does site work in Garden City need its own permit?",
          answer: "Yes. Any activity that disturbs land requires a general erosion and sediment control permit, according to Garden City's residential permit page, and Public Works fees come with it. Grading and excavation for a new house fall under that, so we include the permit in the site budget.",
        },
      ],
    },
  },
  "home-additions": {
    "boise": {
      intro: "Planning a structural home addition in Boise, a new footprint or a second story? In the North End and elsewhere in Boise, an addition must fit local building requirements and the city's inspection steps, and it has to join the existing house cleanly. Additions run design-build, so the same team that measures your house frames the new rooms. Costs appear line by line, you get a written report every week, and the workmanship carries a written warranty. We're happy to start with a free planning consultation at your place in Boise, or have the estimator give the addition a planning range before we visit.",
      faqs: [
        {
          question: "How much does home additions cost in Boise?",
          answer: "Addition costs in Boise follow the Treasure Valley market generally. Additions aren't priced the way a home on an empty site is, because the work wraps around a house that's already standing. A walkthrough of your property produces a line-item budget specific to the site.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "A room addition can add a bedroom, a bigger living area, a suite, or flexible space as a household changes. In a Boise house, often an older one, we begin by working out how the new space will connect to what is already built.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Yes, that's exactly what this service is for. It begins with a conversation in your Boise home, then a review of the existing structure, the utilities, access, and the part of the house where the addition might connect.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes. Boise and the wider Ada County area are places we build regularly, and we know how local plan review and impact fees apply to additions.",
        },
        {
          question: "How do I get a budget for home additions in Boise?",
          answer: "The online estimator gives a planning range for your addition; after that, book a free planning consultation. On a walk of the property we flag the site cost drivers, such as equipment access and where the utilities run.",
        },
        {
          question: "When does a Boise addition need extra permits?",
          answer: "Under Boise's homeowner guide, you need a building permit to add a room, garage, carport, or other attached structure. It also calls for an erosion and sediment control permit on residential additions or improvements with more than 500 sq ft of disturbance or more than 10 cubic yards of excavation.",
        },
      ],
    },
    "meridian": {
      intro: "Structural home additions in Meridian, new footprint or a second story, often go onto houses that are only 15 or 20 years old. An addition near Lochsa Falls or elsewhere in Meridian must still satisfy local building requirements and the city's inspections, and it has to tie into the house you have. From our Meridian base we do additions design-build. You get an itemized budget for the new space, a written weekly update, and a written warranty on our work. The estimator gives a planning range for an addition to your Meridian home, and our planning consultation costs you nothing.",
      faqs: [
        {
          question: "How much does home additions cost in Meridian?",
          answer: "Meridian addition pricing moves with the Treasure Valley. Building onto an existing house isn't priced like building a home on an empty lot. We walk your property and give you an itemized budget for the site.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "Additions can add a bedroom, a larger living space, a suite, or flexible room for a household whose needs are changing. On a Meridian home, step one is figuring out how the new space will join the existing house.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Yes. Adding onto your current house is what this service is built around. We begin with a conversation at your Meridian home and look over the existing structure, the utilities, access, and where the addition might attach.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. We're based in Meridian and build here and throughout Ada County regularly, so plan review steps and impact fees for additions are familiar to us.",
        },
        {
          question: "How do I get a budget for home additions in Meridian?",
          answer: "Use the estimator for a planning range, and then arrange a free planning consultation at your house. While we're there we'll walk the property with you and flag the site cost drivers.",
        },
        {
          question: "What does Meridian charge to file an addition permit?",
          answer: "Meridian's fee schedule charges $50 to apply for a residential addition or remodel permit, and the permit fee is then figured from the project's valuation. Starting work without a permit doubles the fees as a minimum charge, which is one reason permitting is built into our scope.",
        },
      ],
    },
    "nampa": {
      intro: "Thinking about a structural home addition in Nampa, a new footprint or a second story? An addition near Downtown Nampa or anywhere else in the city has to suit local building requirements, clear the inspection steps, and connect cleanly to the house you live in. We work design-build, so expect weekly written updates, a written warranty for the work, and a budget broken out by line. A free planning consultation at the house is the usual start in Nampa, and the estimator can give a planning range for the addition beforehand.",
      faqs: [
        {
          question: "How much does home additions cost in Nampa?",
          answer: "Nampa prices follow the broader Treasure Valley. An addition isn't priced the way a home on a vacant lot is, since the work ties into a house that's already there. Once we walk the property, you'll get a budget for it broken out line by line.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "An addition can create a bedroom, extra living area, a suite, or flex space for a household whose needs are shifting. In a Nampa home, the first job is deciding where and how the new rooms tie into the existing house.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Yes. That's what this service exists for. It opens with a talk at your Nampa house; then we look over the structure as it stands, the utilities and access, and the place the addition would likely join.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Definitely. Our crews work in Nampa year-round and across the rest of Canyon County, and we know what Nampa's plan review and impact fees mean for an addition.",
        },
        {
          question: "How do I get a budget for home additions in Nampa?",
          answer: "The estimator on our website gives you a planning range quickly; a free planning consultation follows, where we cover scope, budget, and where you'd like to expand. We'll also walk the property with you to identify what will move the site costs.",
        },
        {
          question: "Does converting space in a Nampa home need a permit?",
          answer: "Yes. Under Nampa's residential FAQ, turning an attic, basement, or garage into finished living space takes a building permit, as does making any window or door opening bigger or smaller. Interior paint, flooring, and cabinets don't need one, but once framing is exposed, a permit applies.",
        },
      ],
    },
    "eagle": {
      intro: "Structural home additions in Eagle, new footprint or a second story, let you stay in a neighborhood you already like. Whether the house is near Banbury or elsewhere in Eagle, the new rooms must satisfy Eagle's building rules, clear its inspections, and join the existing home without looking tacked on. We handle additions design-build, with written updates every week, an itemized budget, and workmanship backed by a written warranty. Ask for a free planning consultation at your home in Eagle, or get a planning range for the addition from the estimator first.",
      faqs: [
        {
          question: "How much does home additions cost in Eagle?",
          answer: "Eagle costs track the general Treasure Valley picture. Building onto a house is priced differently from building a home on a bare lot. A walk of your property gives us what we need for an itemized budget for the site.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "Additions can give you a suite, a bedroom, flexible space, or a bigger living area for changing household needs. Step one is studying how the new rooms can tie into the house you have.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Of course. That's the purpose of this service. First comes a conversation at your home, then we look at the existing structure, utilities, access, and where the addition would tie in.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "We do. Eagle additions are regular work for us, as are projects elsewhere in Ada County, and we know how Eagle's review process and impact fees apply to an addition.",
        },
        {
          question: "How do I get a budget for home additions in Eagle?",
          answer: "Open with the estimator for a planning range. When you're ready, arrange a free planning consultation, knowing which rooms you need. We'll also walk the property with you and name where the site costs will come from.",
        },
        {
          question: "How long does Eagle take to review an addition?",
          answer: "The City of Eagle Building Division lists about six weeks for residential additions, the same window it posts for new homes and shops, assuming no revisions are needed. The city requires permits for additions, alterations, and enlargements, so we plan that review into the schedule.",
        },
      ],
    },
    "kuna": {
      intro: "Many structural additions in Kuna, new footprint or a second story, are built onto houses that are still fairly new. Near Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and elsewhere in Kuna, an addition still answers to city code and inspections, and it has to blend with the existing structure. One design-build team handles the addition from first measurement to final paint. Your budget is itemized, written updates come weekly, and our workmanship has a written warranty. Have us out for the free planning consultation, or let the estimator size up a planning range for the new rooms on your Kuna house.",
      faqs: [
        {
          question: "How much does home additions cost in Kuna?",
          answer: "Kuna budgets mirror the wider Treasure Valley market. Pricing an addition is a different exercise from pricing a home on a bare lot. When we walk the property in person, you get a line-by-line budget for it.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "Typical projects include a new bedroom, a guest suite, a bigger living area, or flexible space that adapts as the household changes. The starting point is where the addition meets the existing home.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Yes, absolutely. This service exists for exactly that. It begins with an in-home conversation plus a review of the existing structure, utilities, access, and the spot where new meets old.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "Definitely. We're building additions in Kuna all the time, and in nearby Ada County towns, and Kuna's review and impact fees for that work are familiar.",
        },
        {
          question: "How do I get a budget for home additions in Kuna?",
          answer: "Our estimator offers a planning range, and the free planning consultation refines it; photos of the house help. On that visit we look over the property and call out what drives its site costs.",
        },
        {
          question: "What does Kuna charge to permit an addition?",
          answer: "Kuna's fee schedule prices permits by valuation. A project valued at $50,001 to $100,000 starts at $506, and one valued at $100,001 to $250,000 starts at $764, each plus a set amount per additional $1,000. The $70 submittal fee and hourly plan review apply as well.",
        },
      ],
    },
    "caldwell": {
      intro: "Structural home additions in Caldwell, new footprint or a second story, can modernize an older house or expand a newer one. Around Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and in Caldwell neighborhoods, an addition gets the same code review and inspections as new work, plus the challenge of matching the house it attaches to. We take additions design-build. The tie-in, the new rooms, and the finish all sit in one itemized budget, written updates arrive weekly, and a written warranty covers our workmanship. A free planning consultation at your Caldwell home is a good way to begin; the estimator offers an early planning range for the addition as well.",
      faqs: [
        {
          question: "How much does home additions cost in Caldwell?",
          answer: "Caldwell prices follow the overall Treasure Valley market. An addition isn't priced like a new home on an open lot. A walk of your property then gives you an itemized budget for it.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "We plan additions that create flexible space, an extra bedroom, a suite, or more living area when your household's needs shift. It begins with studying how the new rooms will join the existing house.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Yes, that's what we do. Building onto your current house is exactly what this service covers. It starts with a conversation in your living room, and then we study the house as it stands, its utilities and access, and the area the addition would join.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "We do. We build in Caldwell routinely and across Canyon County, and we know how the city's plan review and impact fees apply to an addition.",
        },
        {
          question: "How do I get a budget for home additions in Caldwell?",
          answer: "First, try the online estimator for a planning range on an addition, then sign up for a free planning consultation. We'll also tour the property with you and explain what drives its site costs.",
        },
        {
          question: "Are trade permits for a Caldwell addition priced separately?",
          answer: "Yes. Electrical, plumbing, and mechanical work each takes its own Caldwell permit, and the city's FY2026 schedule charges for that work item by item, starting from a $34 base; each plumbing fixture adds $15.75 and each extended electrical circuit $22.25. We include those in the addition budget.",
        },
      ],
    },
    "star": {
      intro: "Structural home additions in Star, new footprint or a second story, often expand houses that are only a few years old. Around Star River Ranch and throughout Star, an addition is built to city code and inspected, and it has to join the home cleanly. One design-build team handles the addition, with a budget that shows every line, weekly written updates, and a workmanship warranty in writing. To get numbers early, try the online estimator; to go deeper, reserve your free planning consultation.",
      faqs: [
        {
          question: "How much does home additions cost in Star?",
          answer: "Star pricing runs with the general Treasure Valley. An addition can't be priced the way a new home on a vacant lot is. After a walkthrough of the property, we write a line-item budget for it.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "Additions we plan include a bedroom, a suite, more living space, or a flex room for shifting household needs. We begin with how the new space connects to the existing home.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Yes, absolutely. Adding onto an existing home is what it's for. We start with a visit and conversation in your Star home and a review of access, utilities, the existing structure, and the spot where new meets old.",
        },
        {
          question: "Do you build in Star?",
          answer: "We do. Our crews build in Star often and around outlying parts of Ada County, and we've taken additions through Star's plan review and impact fees before.",
        },
        {
          question: "How do I get a budget for home additions in Star?",
          answer: "Begin with the estimator and its planning range. Next comes a free planning consultation; bring the original plans if you have them. We'll walk the property together and identify the site cost drivers.",
        },
        {
          question: "Which addition-related projects need a permit in Star?",
          answer: "Star's FAQ requires permits for structural additions, attached patio covers regardless of size, decks 30 inches or more above grade, and window or door replacements that change the opening size, among other work. A concrete slab on its own needs no building permit.",
        },
      ],
    },
    "middleton": {
      intro: "Structural home additions in Middleton, new footprint or a second story, can add space without giving up a lot you like. In Middleton Heights and across Middleton, the addition must meet local building requirements, pass the city's inspections, and connect cleanly to the existing house. We work design-build, so the addition comes with a line-item budget, a weekly update in writing, and a written workmanship warranty. The estimator gives a planning range online, and the planning consultation is free.",
      faqs: [
        {
          question: "How much does home additions cost in Middleton?",
          answer: "Middleton budgets run with the larger Treasure Valley. An addition is priced on its own terms, not like a home on an empty lot. Set up a walk around the property for an itemized budget for your site.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "An addition can add a larger living room, a bedroom, a suite, or flex space when your household's needs shift. The first step is figuring out how the addition will connect to what's already built.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Absolutely. Adding onto the home you live in is what this service is for. We start with a conversation at your kitchen table, then review the structure as built, its utilities and access, and the likely connection point.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "Yes. We're on site in Middleton routinely, and in nearby Canyon County towns, and additions there go through a plan review and impact fee process we know well.",
        },
        {
          question: "How do I get a budget for home additions in Middleton?",
          answer: "The estimator gives a planning range to start; then book the free planning consultation with a list of the rooms you want. Walking the property together, we'll explain what will drive its site costs.",
        },
        {
          question: "When does a Middleton addition need a permit?",
          answer: "Section 4-1-1 of Middleton's code makes a building permit mandatory before adding to, remodeling, or renovating any structure larger than 200 sq ft. If part of the existing house has to come down to make room, the code also requires a demolition permit for that partial demolition.",
        },
      ],
    },
    "garden-city": {
      intro: "Structural home additions in Garden City, new footprint or a second story, can turn a small house into one that fits your household. Because we know Ada County's review requirements, its impact fees, and Garden City's typical lots, the addition is planned to suit the lot and the existing home. Additions in Garden City run design-build with us: an itemized budget, a written note on progress every week, and the workmanship warranted in writing. Start with the estimator's planning range for your Garden City addition, or have us out for a free planning consultation at the house.",
      faqs: [
        {
          question: "How much does home additions cost in Garden City?",
          answer: "Garden City costs move with the broader Treasure Valley picture. Additions are priced on different terms than a home on bare ground. Once we've walked your property, we'll hand you a line-item budget for it.",
        },
        {
          question: "What kinds of home additions do you plan?",
          answer: "Common additions are an extra bedroom, a suite, a bigger living area, or a flex room that adapts as the household changes. First we look at how the new space will connect to the house you have.",
        },
        {
          question: "Can you add onto the home I already live in?",
          answer: "Absolutely. Expanding an occupied home is exactly what this service covers. The first step is an in-home conversation, followed by a review of utilities, access, the existing structure, and where the addition may connect.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "We do. Garden City homeowners hire us for additions regularly, and so do others around Ada County, and we look after the plan review and impact fees an addition brings.",
        },
        {
          question: "How do I get a budget for home additions in Garden City?",
          answer: "Get a planning range from the online estimator first. Then book a free planning consultation and note where you'd like to expand. We'll walk the property with you and identify which factors set its site costs.",
        },
        {
          question: "Which small projects are exempt from a Garden City permit?",
          answer: "Garden City's building code exempts some minor work: painting, tiling, carpeting, cabinets, and countertops; any job totaling $500 or less in value; and low decks, 12 inches or less above grade, that aren't serving the required exit door. An addition is not among them, so it needs a permit.",
        },
      ],
    },
  },
  "lot-evaluation": {
    "boise": {
      intro: "Lot evaluation and feasibility in Boise answers the expensive questions before you buy. A lot by the North End, or in any other Boise neighborhood, carries local building requirements and inspection steps that shape what can go on it, and our evaluation looks at those alongside the ground itself. If the lot is a go and we build the house, we do it design-build. Expect each cost on its own budget line, a written progress report weekly, and workmanship backed by a written warranty. Start with a free planning consultation about the Boise lot you're weighing, or see what the estimator says a house there might cost as a planning range.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Boise?",
          answer: "Lot evaluation in Boise is priced in line with the Treasure Valley market. A written evaluation of a lot runs $950 to $3,500 across the valley in 2026. Our walk of the lot feeds a line-by-line budget for the site.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "Six things drive it: how far the utilities are, soils that are expansive or unstable, a steep slope that calls for engineered foundations and retaining, no legal access, floodplain status, and needing a well or septic. Any one of them can cost tens of thousands of dollars before construction even begins. On older Boise lots, the location of existing utility lines often comes up first.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes, that's the whole idea. Plenty of buyers book the evaluation inside the inspection contingency window, which leaves room to renegotiate or walk away if the site work will cost more than they thought.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes. We build in Boise regularly and across Ada County, and each evaluation draws on what we know about Boise's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Boise?",
          answer: "First get the estimator's planning range, and after it a free planning consultation. For any Boise lot you're considering, we walk it with you and pinpoint what will drive its site costs.",
        },
        {
          question: "Will a lot evaluation tell me whether Boise or Ada County reviews my permit?",
          answer: "Yes. Parcels inside Boise city limits are permitted by the city's Planning and Development Services, while land past those limits goes through Ada County. The evaluation confirms which side of that line your lot sits on, which affects review steps and fees.",
        },
      ],
    },
    "meridian": {
      intro: "Lot evaluation and feasibility in Meridian helps you know what a parcel will cost before you own it. Near Lochsa Falls and across Meridian, local building requirements and inspection steps shape what you can build, and the evaluation covers those along with soils and utilities. Our Meridian team builds design-build once a lot checks out, which comes with an itemized budget, a written progress note every week, and our workmanship warranted in writing. Bring the parcel to a free planning consultation in Meridian, or try the estimator's planning range for the house you're imagining.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Meridian?",
          answer: "Meridian lot evaluations are priced like the rest of the Treasure Valley. A written evaluation runs $950 to $3,500 in the valley as of 2026. After we walk the lot, you get a budget broken out line by line for it.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "The big cost drivers are distance to utilities, soils that are expansive or unstable, steep slopes needing engineered foundations and retaining walls, missing legal access, floodplain status, and having to add a well or septic. Any single one can push the cost up by tens of thousands before construction begins.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes, that's the purpose. Many buyers book one while their inspection contingency is still open, so they can renegotiate or walk away if site work looks more expensive than they planned.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. Meridian is our home base, we build regularly across Ada County, and our evaluations reflect what we know about local plan review and impact fees.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Meridian?",
          answer: "Start with a planning range from the estimator, then book a free planning consultation. For a Meridian lot you're considering, we walk the ground with you and name the site cost drivers.",
        },
        {
          question: "Which county reviews a lot in Meridian?",
          answer: "Ada County. Census TIGER geography places all of Meridian in Ada County, and inside city limits permits run through Meridian's Building Services rather than the county. A parcel outside the city follows Ada County's process, and the evaluation confirms which applies.",
        },
      ],
    },
    "nampa": {
      intro: "Lot evaluation and feasibility in Nampa tells you what a parcel will really cost. Around Downtown Nampa and elsewhere in town, what a lot can hold depends on the city's building rules and inspection sequence, so the evaluation weighs those alongside the ground. If you go ahead and build, the house is ours to design and build, with a detailed budget by line item, a written update weekly, and a written warranty on what we build. Request a free planning consultation about the parcel you're looking at in Nampa, or see a planning range for the build in the estimator.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Nampa?",
          answer: "Nampa budgets line up with the overall Treasure Valley market. A written lot evaluation in the valley costs $950 to $3,500 as of 2026. Walk the property with us and we'll prepare an itemized budget for that parcel.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "The usual culprits: utilities far from the lot, unstable or expansive soils, steep ground that needs retaining walls and an engineered foundation, a lack of legal access, being in a floodplain, and having to drill a well or install septic. Any of them can add tens of thousands before construction even starts.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes, that's exactly what it's for. Lots of buyers time it to fall inside their inspection contingency, which keeps the option to renegotiate, or to back out, if site work turns out costlier than expected.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Absolutely. Nampa is regular work for us, and so are nearby Canyon County towns, and every evaluation reflects what we've learned about Nampa's plan review rules and impact fees.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Nampa?",
          answer: "It takes three steps. Our estimator returns a planning range. Next comes the free planning consultation; bring the parcel number. Then, if you're considering a lot, we walk it together to pin down where the site money goes.",
        },
        {
          question: "What if a Nampa property has structures built without permits?",
          answer: "Per Nampa's residential FAQ, finding work that was never permitted can hold up a sale and may require permits and code corrections, or removal of the work, and insurance may not cover problems it causes. If a lot you're buying has older outbuildings, the evaluation flags them.",
        },
      ],
    },
    "eagle": {
      intro: "Lot evaluation and feasibility in Eagle, including Banbury can save you from a parcel that costs far more to build on than it looks. Throughout Eagle, city building rules and the inspection process limit what a lot can hold, and the evaluation considers them alongside the soil and slope. A lot that passes our review can go straight into design-build with the same team. That brings an itemized budget, weekly written updates, and a workmanship warranty you keep in writing. Request a quote for an Eagle build, or bring the listing to a free planning consultation.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Eagle?",
          answer: "Eagle pricing tracks the larger Treasure Valley picture. This year, a written lot evaluation in the valley runs $950 to $3,500. The next step is a walk-through of your lot, which yields a line-by-line budget for that parcel.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "Start with soils: expansive or unstable ground drives foundation cost. Next comes utility distance, slopes needing engineered foundations and retaining, any floodplain designation, a lack of legal access, and whether you need a well or septic. Any one can mean tens of thousands before building starts.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes. Checking a lot before you buy is what we recommend. Many buyers schedule it inside the inspection contingency period, which keeps renegotiating or walking on the table if site costs turn out worse than expected.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "Yes. Eagle is regular territory for us, along with the rest of Ada County, and our evaluations reflect Eagle's plan review steps and impact fees. City permits come from the Eagle Building Division.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Eagle?",
          answer: "Getting to a budget takes three steps. Our estimator gives a planning range. Then comes a free planning consultation; tell us your contingency deadline. Finally, we walk the lot together to identify where the site money goes.",
        },
        {
          question: "Can I check a property's permit history in Eagle?",
          answer: "Eagle's online permit portal can be searched by permit number, contractor, or address. During an evaluation we use that kind of record to see what has already been permitted on a parcel, which helps spot outbuildings or past work that may affect a new home.",
        },
      ],
    },
    "kuna": {
      intro: "Lot evaluation and feasibility in Kuna shows what a parcel will cost before it's yours. Near Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and across Kuna, code and inspections shape what can go on a lot, so the evaluation reviews them along with the ground. If the parcel works and we build on it, it'll be design-build. That means a budget itemized by line, a written update every week, and a written warranty covering the workmanship. Want a rough number for a house on that Kuna parcel? Our estimator gives a planning range quickly, and we never charge for the planning consultation.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Kuna?",
          answer: "Kuna prices follow the broader Treasure Valley. For 2026, a written lot evaluation in this valley typically costs between $950 and $3,500, depending on the parcel. Ask us to walk the lot and you'll get a line-by-line budget tailored to that land.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "Expensive lots usually share a few traits. They're far from utilities, the ground is unstable or expansive, slopes call for retaining and engineered foundations, there's no legal access, the land sits in a floodplain, or a well or septic is required. Any one of those can add tens of thousands before construction.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes, that's the whole idea. A lot of buyers schedule an evaluation while the inspection contingency is open to keep the option to renegotiate or walk when site work looks costlier than planned.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "Yes. We run projects in Kuna constantly, and around Ada County, and we know Kuna's review rules and impact fees well enough to flag them in an evaluation.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Kuna?",
          answer: "Run our estimator to see a planning range, then arrange a free planning consultation and send the listing link. If a listing looks promising, we'll tour the parcel with you and say what will drive its site costs.",
        },
        {
          question: "How does Kuna handle permit applications after I buy?",
          answer: "Applications for homes are handled first come, first served by Kuna's Building Department, which also charges $65 for each re-inspection after a failed inspection, according to its forms page and fee schedule. A lot evaluation that settles site questions early helps the eventual application go in complete.",
        },
      ],
    },
    "caldwell": {
      intro: "Our Caldwell lot evaluation and feasibility work prices the ground before you buy it. Along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and elsewhere in Caldwell, city requirements and the inspection process affect what a parcel can hold, so the evaluation examines them alongside soils, access, and utilities. Should the parcel pass and we build on it, it's design-build: an itemized budget, a written status report each week, and a written warranty for the workmanship. The estimator can rough out a planning range for a house on a Caldwell parcel, and the first planning consultation about it is free.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Caldwell?",
          answer: "Caldwell costs run with the wider Treasure Valley picture. As of 2026, written lot evaluations across the valley cost between $950 and $3,500. Book a lot walkthrough to get an itemized budget for that exact parcel.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "Six things, each capable of adding tens of thousands before construction starts: no legal access, a floodplain designation, long runs to utilities, a need for a well or septic, unstable or expansive soils, and steep ground that calls for engineered foundations and retaining.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes, please do. Evaluating before an offer is what we recommend. Buyers often time it inside the inspection contingency period, so renegotiating or walking stays possible if site work costs look worse than expected.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "Definitely. We take on Caldwell projects all the time, and in other Canyon County communities, and the evaluation factors in Caldwell's plan review and impact fees. Caldwell's Department of Building Safety, at 205 S. 6th Ave., issues permits in town.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Caldwell?",
          answer: "Open with the estimator, which gives a planning range, then schedule a free planning consultation and mention your contingency deadline. For any Caldwell lot on your shortlist, we walk it together and pinpoint what moves its site costs most.",
        },
        {
          question: "Which reviews on a Caldwell permit relate to the lot itself?",
          answer: "Caldwell's FY2026 fee schedule adds Planning and Zoning review at 35% of the permit fee (minimum $55) and engineering review at 20%, beside the 40% building plan review. Those reviews look at the site, so lot issues found early help keep them simple.",
        },
      ],
    },
    "star": {
      intro: "In Star, a lot evaluation and feasibility review explains a parcel before you're committed. Around Star River Ranch and across Star, the city's building requirements and inspection steps affect what a lot can support, so the evaluation reviews them with the soils and utilities. Should the evaluation lead to a house, we'll take it design-build. You get the budget itemized, a written note each week on progress, and a written warranty on the work. Today, the estimator can show a planning range for building in Star, and the planning consultation on the lot is free.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Star?",
          answer: "Star pricing follows the wider Treasure Valley market. This year, written lot evaluations in the valley range from $950 to $3,500. A lot walkthrough then leads to a budget split into line items for that parcel.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "Any of these: utilities that are far away, unstable or expansive soils, a steep slope that needs engineered foundations and retaining, no legal access, a floodplain location, or a required well or septic. Any single one of them may add tens of thousands of dollars ahead of the foundation.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes, please do. Checking a lot before you buy is exactly the idea. Buyers often time it during the contingency period for inspections, so renegotiating or walking stays possible should site work cost more than expected.",
        },
        {
          question: "Do you build in Star?",
          answer: "Definitely. Our crews work in Star all the time, and elsewhere in Ada County, and every evaluation covers Star's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Star?",
          answer: "See a planning range in the estimator first. After that, arrange the free planning consultation. With a lot in view, we'll go walk it with you and flag where its site costs will come from.",
        },
        {
          question: "Which county is a Star lot in?",
          answer: "It depends. Census TIGER geography puts about 83% of Star in Ada County and about 17% in Canyon County, and inside city limits the Star Building Department issues permits. The evaluation confirms the jurisdiction for your parcel.",
        },
      ],
    },
    "middleton": {
      intro: "Lot evaluation and feasibility in Middleton checks whether a parcel can actually take a house. In Middleton Heights and elsewhere in Middleton, city building requirements and inspection steps shape what a lot can hold, so we review them along with soils, access, and utilities. Lots that pass become design-build projects with the same crew. You'll see an itemized budget, get written progress reports weekly, and keep a written warranty on the workmanship. Ask for a free planning consultation on the Middleton parcel, or let the estimator show you a planning range for building on it.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Middleton?",
          answer: "Middleton budgets track the wider Treasure Valley. In 2026, expect $950 to $3,500 for a written lot evaluation in the valley. A lot walkthrough then results in a line-item budget for your parcel.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "Start with soils: unstable or expansive soil drives foundation cost. Next comes utility distance, steep ground that requires retaining and engineered foundations, floodplain status, missing legal access, and whether a well or septic is needed. Each can add tens of thousands before building starts.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes, and that's what it's for. Many buyers book the evaluation inside their inspection contingency so they can renegotiate, or walk away, when site work looks costlier than planned.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "Yes. Our crews build in Middleton often and in the surrounding Canyon County area, and an evaluation there accounts for Middleton's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Middleton?",
          answer: "Begin with our estimator, which gives a planning range; a free planning consultation is next, parcel number in hand. With a lot in view, we visit it with you and name which factors set its site costs.",
        },
        {
          question: "What does Middleton require of a lot before a house can go on it?",
          answer: "Under Middleton city code 4-1-1, a lot must be legally subdivided before a residence goes on it, and it needs 30 feet of street frontage along a public right-of-way and must meet the city's subdivision requirements. Homes with garages must also have a hard-surfaced driveway and approach, concrete or asphalt, matching at least the garage's width.",
        },
      ],
    },
    "garden-city": {
      intro: "Lot evaluation and feasibility in Garden City matters because lots near the river come with extra rules. Parcel by parcel, the evaluation draws on our experience with Ada County plan review, impact fees, and the ground conditions typical of Garden City. When an evaluation turns into a project, we build design-build: costs listed line by line, a short written report every week, and a workmanship warranty in writing. Let's talk about the Garden City lot at a free planning consultation, or try the estimator for a planning range on the house you'd put there.",
      faqs: [
        {
          question: "How much does lot evaluation & feasibility cost in Garden City?",
          answer: "Garden City budgets follow the broader Treasure Valley picture. Valleywide, written lot evaluations are priced at $950 to $3,500 in 2026. Request a lot walkthrough and you'll get an itemized budget for your particular site.",
        },
        {
          question: "What makes a lot expensive to build on?",
          answer: "A handful of conditions, any of which can add tens of thousands before you break ground: lack of legal access, a floodplain designation, utilities far from the lot, a need for a well or septic, soils that are expansive or unstable, and slopes steep enough for engineered foundations and retaining.",
        },
        {
          question: "Can I get a lot evaluated before I make an offer?",
          answer: "Yes. A pre-offer evaluation is exactly the idea. It's common to book it inside the inspection contingency period, leaving room to renegotiate or walk should site work cost more than expected.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "We do. We're building in Garden City often and across Ada County, and the city's plan review process and impact fees are factored into every evaluation.",
        },
        {
          question: "How do I get a budget for lot evaluation & feasibility in Garden City?",
          answer: "Two quick steps come before the evaluation itself: a planning range from the estimator, and a free planning consultation. If you're already looking at a Garden City lot, we'll go walk it together and name the conditions that will drive its site costs, which is exactly what the written evaluation then documents.",
        },
        {
          question: "Are there special rules for Garden City lots near the Greenbelt?",
          answer: "Yes. Garden City bars fences and retaining walls from the first 5 feet beside the Greenbelt or Nature Path, and the city limits them to 3.5 feet between 5 and 15 feet away unless conditions are met. Floodplain review is also listed among new-home permit fees, so both are part of a Garden City evaluation.",
        },
      ],
    },
  },
  "design-build": {
    "boise": {
      intro: "Design-build in Boise puts drawings and construction with one team. Homes in the North End and the rest of Boise need plans that suit local building requirements and the city's inspection timing, and in design-build the people drawing the house are the people who will build it. Expect an itemized budget, a progress note in writing each week, and workmanship covered by a written warranty. Start a Boise design-build project with a free planning consultation, or work out a planning range in the estimator before you call.",
      faqs: [
        {
          question: "How much does design-build cost in Boise?",
          answer: "Design-build pricing in Boise tracks the broader Treasure Valley. Homes built this way across the valley are budgeting $250\u2013$400 for each finished square foot in 2026, with land excluded. Book a lot walkthrough and we'll build a line-item budget around your site.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "One company, one contract, covering both the design and the construction. You have a single party accountable for the result, and the house is priced the whole time it is being designed instead of bid after the drawings are done.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Not automatically. What it removes is the costliest mistake in home building: finishing a design, finding it far over budget, and paying to re-draw it. Because pricing runs alongside design, that problem shows up at the sketch stage rather than after the construction documents are complete.",
        },
        {
          question: "Do you build in Boise?",
          answer: "Yes. Boise design-build projects are steady work for us, as is the rest of Ada County, and how the city handles plan review and impact fees is familiar ground.",
        },
        {
          question: "How do I get a budget for design-build in Boise?",
          answer: "The online estimator produces a planning range, and next comes the free planning consultation. When a Boise lot is under consideration, we go see it with you and identify the factors that will drive its site costs.",
        },
        {
          question: "Who has to be licensed on a Boise build?",
          answer: "According to Boise's homeowner guide, when someone other than the owner performs trade work that needs a permit, that person needs a State of Idaho registration and license. Under a design-build contract that responsibility sits with us, an Idaho Registered Contractor #8381215, and the licensed trades we schedule, not with you.",
        },
      ],
    },
    "meridian": {
      intro: "Design-build in Meridian means one team from the first sketch to the final walkthrough, and our base of operations is right here. Houses near Lochsa Falls and across Meridian have to meet local requirements and pass inspection at each stage, and a single design-build team plans for that. Every line of the budget is visible to you, a written update lands each week, and the workmanship carries a warranty on paper. Our Meridian office offers a free planning consultation to start, and the estimator will give a design-build planning range if you want a figure first.",
      faqs: [
        {
          question: "How much does design-build cost in Meridian?",
          answer: "Meridian prices line up with the broader Treasure Valley. Valleywide, a design-build home is planning at $250 to $400 per finished square foot in 2026, before you count land. A lot walkthrough gives you the line-item budget for your own site.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "It means a single company and a single contract handle the design and the construction of your house. Accountability sits with one party, and pricing continues throughout design rather than arriving as a bid when the plans are finished.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Not necessarily cheaper, but it eliminates the most costly way a home project goes wrong: a finished design that comes back far over budget and must be redrawn. With pricing running the whole time, that shows up while the plans are still sketches, not after construction documents.",
        },
        {
          question: "Do you build in Meridian?",
          answer: "Yes. Meridian is where we're based and where we build often; Ada County projects in general are regular work, and we know this city's plan review and impact fees well.",
        },
        {
          question: "How do I get a budget for design-build in Meridian?",
          answer: "First, the online estimator for a planning range. Second, a free planning consultation. If you have your eye on a Meridian lot, we'll walk it together and identify the items that will set its site cost.",
        },
        {
          question: "What happens if work starts in Meridian before the permit is issued?",
          answer: "Meridian's fee schedule makes double fees the minimum charge when work begins without a permit. In our design-build contract, the permit is our job and is part of the schedule, so construction doesn't start until the city has issued it.",
        },
      ],
    },
    "nampa": {
      intro: "Design-build in Nampa keeps drawing and building in one set of hands. In Downtown Nampa and across the city, a house needs a layout that meets local building requirements and lines up with inspections, and the team designing it is the team that will build it. With design-build, Nampa owners deal with one company, read a budget itemized line by line, get progress in writing every week, and keep a written workmanship warranty. Online, the estimator gives a design-build planning range for Nampa homes; in person, the first planning consultation is free.",
      faqs: [
        {
          question: "How much does design-build cost in Nampa?",
          answer: "Nampa pricing moves with the larger Treasure Valley market. For 2026, a design-build home in the valley is planned at roughly $250\u2013$400 a square foot of finished space, not including land. Book a walk of your lot and we'll write an itemized budget for that site.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "Design and construction come from one company under one contract. That gives you one point of accountability, and the house is priced continually as it's designed rather than being sent out to bid once the drawings are complete.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Not by default, but it rules out the most expensive failure in home building: a finished design that prices far over budget and has to be drawn again. Ongoing pricing catches that while it's still a sketch, well before construction documents exist.",
        },
        {
          question: "Do you build in Nampa?",
          answer: "Yes. Nampa projects are year-round work for us, along with outlying parts of Canyon County, and we know the area's plan review steps and impact fees.",
        },
        {
          question: "How do I get a budget for design-build in Nampa?",
          answer: "There are three steps. The estimator gives you a planning range. Then we meet for a free planning consultation, where it helps to tell us your budget ceiling. Finally, for any lot you're weighing, we go see it with you and pin down what drives its site costs.",
        },
        {
          question: "Who can pull a building permit in Nampa?",
          answer: "According to Nampa's residential FAQ, when homeowners aren't doing the work themselves, a building contractor registered with the State of Idaho, or a licensed trade sub-contractor, has to pull the permit and do the work. Under design-build, that's our role, and we coordinate the licensed trades.",
        },
      ],
    },
    "eagle": {
      intro: "Design-build in Eagle means the people who draw your house are the people who build it. Near Banbury and across Eagle, a home's plan has to answer to local requirements and the city's inspection sequence, and one team keeps both in view. Under one design-build agreement you get an itemized cost breakdown, written updates weekly while we build, and a written workmanship warranty when we hand over the keys. Request a free planning consultation for your Eagle project, or get the estimator's planning range before we talk.",
      faqs: [
        {
          question: "How much does design-build cost in Eagle?",
          answer: "Eagle pricing moves with the overall Treasure Valley. This year, design-build homes in the valley are being planned at $250\u2013$400 per finished square foot, before land. Ask us to walk your lot, and a line-by-line budget for that site follows.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "It's one contract with one company covering design and the build. There's one point of accountability, and instead of bidding a finished design, we price it continuously while it's drawn.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Sometimes, but not automatically. The value is in avoiding a completed design that's far over budget and must be redrawn. Since pricing never stops, that shows up at the sketch stage, not after construction documents.",
        },
        {
          question: "Do you build in Eagle?",
          answer: "Yes. We're on Eagle job sites week in and week out, plus outlying parts of Ada County, and we're at home with Eagle's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for design-build in Eagle?",
          answer: "Price it first in our estimator for a planning range, then come in and talk scope and budget at a free planning consultation. For a lot you're considering, we'll go walk it with you and show what is likely to move the site costs.",
        },
        {
          question: "Why does a complete drawing set matter in Eagle?",
          answer: "The City of Eagle's posted residential review time of about six weeks assumes the plans need no revisions; any revision adds time. In design-build, pricing, engineering, and drafting are coordinated before submittal, which gives an Eagle permit its best chance of clearing review on the first pass.",
        },
      ],
    },
    "kuna": {
      intro: "With design-build in Kuna, the same team takes your home from concept to keys. Near Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and across Kuna, a new house must satisfy the city's code and its inspection sequence, and a single team that both draws and builds keeps those in sync. We design and build on one contract, so the budget shows each line, a written progress report reaches you weekly, and a written warranty backs our workmanship. Running the estimator takes a few minutes and yields a planning range for a design-build home in Kuna; the planning consultation that follows is free.",
      faqs: [
        {
          question: "How much does design-build cost in Kuna?",
          answer: "Kuna prices track the overall Treasure Valley. In 2026, design-build homes valleywide are budgeted at $250 to $400 for each finished square foot, without land. The next step is a walk of your lot, which ends in a line-item budget for the site.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "In short: one contract and one company for both design and construction. A single party answers for how it turns out, and the house is priced continuously while it's designed instead of bid once the drawings are finished.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Not always cheaper. What it removes is the costliest failure in home building, a completed design far over budget that has to be re-drawn. With continuous pricing, you see it during sketches, not after construction documents.",
        },
        {
          question: "Do you build in Kuna?",
          answer: "We do. Our crews are in Kuna year-round and across Ada County, and we know Kuna's review requirements and impact fees well.",
        },
        {
          question: "How do I get a budget for design-build in Kuna?",
          answer: "Our estimator gives a planning range to start. Next, a free planning consultation covers scope, budget, and your priorities. If there's a lot in mind, we'll visit it with you and pinpoint what the site work will hinge on.",
        },
        {
          question: "What plan review fees does Kuna charge?",
          answer: "Kuna charges $70 to submit a residential permit and bills structural plan review at $65 an hour, one hour minimum, according to the Building Department's fee schedule. Because review time is billed hourly, a well-coordinated design-build plan set also helps keep review fees down.",
        },
      ],
    },
    "caldwell": {
      intro: "Design-build in Caldwell keeps the drawings, the budget, and the construction with one team. Along Indian Creek, the creek that flows through Kuna, Nampa, and Caldwell, and across Caldwell, a home's layout must work with the city's building requirements and its inspection order, which is easier when the designers and builders are the same people. Design-build is the whole point here. Caldwell clients get a budget broken into line items, a written progress report every week, and workmanship we warrant in writing. For a ballpark on a Caldwell design-build home, the estimator's planning range is a good start, and you can follow it with a free planning consultation.",
      faqs: [
        {
          question: "How much does design-build cost in Caldwell?",
          answer: "Caldwell budgets mirror the broader Treasure Valley. Valleywide in 2026, design-build homes plan from $250 up to $400 a finished square foot, plus land. Arrange a walkthrough of the lot for an itemized budget specific to your site.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "Both design and construction sit under one contract from one firm. Accountability rests with one party, and the house is priced as it's designed rather than going out to bid when the plans are complete.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Not always. Its real job is preventing a finished design that blows the budget and has to be re-drawn. With pricing running the whole time, that surfaces during sketches, well before construction documents.",
        },
        {
          question: "Do you build in Caldwell?",
          answer: "Yes. Caldwell is a regular stop for our design-build crews, as are other Canyon County towns, and we're well versed in the city's plan review rules and impact fees.",
        },
        {
          question: "How do I get a budget for design-build in Caldwell?",
          answer: "First, see a planning range in our estimator. Then set up your free planning consultation; sketches and a target budget help. If you have land in mind, we'll walk it together and explain what moves its site costs most.",
        },
        {
          question: "What contractor information does a Caldwell permit require?",
          answer: "Caldwell's residential permit packet asks the contractor to declare their registration under Idaho Code section 54-5209, which puts that registration number on the permit. In a design-build contract, we are that registered contractor and we coordinate the separate trade permits.",
        },
      ],
    },
    "star": {
      intro: "Design-build in Star puts your whole project with one accountable team. Around Star River Ranch and across Star, a house has to suit the city's building requirements and inspection sequence, and design-build keeps the people drawing it and the people building it working together. Our design-build process gives Star owners an itemized budget, a progress summary in writing every week, and a written warranty for our workmanship at the end. The estimator gives a planning range for design-build homes in Star, or you can come in for the free planning consultation.",
      faqs: [
        {
          question: "How much does design-build cost in Star?",
          answer: "Star pricing follows the larger Treasure Valley market. Across the valley, 2026 design-build homes plan at around $250 to $400 per finished square foot of living area, excluding land. Once we walk the lot together, we write a budget broken out by line for it.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "Put simply: a single contract with a single company, covering design through construction. One party is accountable to you, and the price is tracked continuously during design, not bid once it's finished.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Not necessarily, though it takes away the most expensive way a home project goes wrong: a completed design that lands far above budget and needs re-drawing. Pricing alongside design flags it at the sketch stage rather than after construction documents.",
        },
        {
          question: "Do you build in Star?",
          answer: "Definitely. Star design-build projects are routine for us, as are jobs in nearby Ada County towns, and we look after Star's plan review and impact fees.",
        },
        {
          question: "How do I get a budget for design-build in Star?",
          answer: "Lead with our free estimator, which gives a planning range. Next, reserve a free planning consultation for a conversation about scope and budget. When a lot is under consideration, we visit it with you and flag the conditions that drive its site costs.",
        },
        {
          question: "Who can apply for a building permit in Star?",
          answer: "Star's FAQ lets architects, homeowners, and contractors apply for permits, and a contractor who applies must hold a current, valid Idaho license. In design-build, we prepare and file the permit as your Idaho Registered Contractor.",
        },
      ],
    },
    "middleton": {
      intro: "Design-build in Middleton keeps one team responsible from concept to keys. In Middleton Heights and elsewhere in town, a home must fit Middleton's code and inspection steps, and a single team drawing and building it keeps those aligned. Design-build in Middleton looks like this: a line-item budget, a written weekly report from the job, and a written warranty on everything we build. Book a free planning consultation when you're ready to plan a Middleton home, or start with a design-build planning range from the estimator.",
      faqs: [
        {
          question: "How much does design-build cost in Middleton?",
          answer: "Middleton pricing runs with the overall Treasure Valley. For 2026, design-build homes in the valley typically plan in the range of $250 to $400 for every finished square foot, before land. Once we've walked your site, we write up an itemized budget for it.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "Design and construction come under one contract from one firm. The result is one party accountable, and the design is priced continuously instead of being bid after the drawings are done.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Not by default, but it removes home building's costliest failure: a fully drawn design that prices well over budget and must be redrawn. Pricing alongside design catches that while it's still a sketch instead of after construction documents.",
        },
        {
          question: "Do you build in Middleton?",
          answer: "Yes. Our team builds in Middleton regularly and in the outlying parts of Canyon County, and we're used to how the city runs plan review and charges impact fees.",
        },
        {
          question: "How do I get a budget for design-build in Middleton?",
          answer: "Start with our estimator and the planning range it gives for a design-build home. A free planning consultation is next; tell us your budget ceiling there. With a lot in view, we'll walk it with you and flag whatever will likely drive its site costs.",
        },
        {
          question: "How does Middleton verify contractor registration?",
          answer: "Middleton's permit portal links to the Idaho Contractor Registration Act, including the requirement in Idaho Code 54-5209 that a registration number accompany building permits, and offers a contractor registration search. As your design-build contractor, our registration goes on the permit.",
        },
      ],
    },
    "garden-city": {
      intro: "Design-build in Garden City keeps design, permits, and construction with one team. From day one, that team brings knowledge of Ada County plan review, the local impact fees, and how Garden City lots tend to behave. In a design-build contract with us, the budget is line-item from the first draft, progress is written up and sent weekly, and the workmanship carries a written warranty. Garden City clients usually start with a free planning consultation, though the estimator also gives a design-build planning range if you'd like one beforehand.",
      faqs: [
        {
          question: "How much does design-build cost in Garden City?",
          answer: "Garden City budgets track the wider Treasure Valley. Valleywide, design-build homes carry a 2026 planning range of $250 to $400 for every square foot of finished area, excluding land. Once we walk your lot, you'll receive an itemized budget for it.",
        },
        {
          question: "What does design-build mean for a new home?",
          answer: "A single firm holds one contract covering design and the build. Accountability sits in one place, and rather than bidding the plans at the end, the design gets priced the whole way while it's drawn.",
        },
        {
          question: "Is design-build cheaper than hiring an architect separately?",
          answer: "Not always. The real savings come from heading off a design that comes in way over budget and must be redrawn. Because we price continuously, that shows up at the sketch stage, well before construction documents.",
        },
        {
          question: "Do you build in Garden City?",
          answer: "Yes. Garden City design-build projects come up frequently, along with work in the surrounding Ada County area, and we handle the plan review and impact fees for you.",
        },
        {
          question: "How do I get a budget for design-build in Garden City?",
          answer: "First, request a quote for a planning conversation. Then ask for a free planning consultation and bring your budget ceiling. When a lot is under consideration, we walk it together and flag its site cost drivers.",
        },
        {
          question: "When does Garden City start reviewing a permit application?",
          answer: "According to its residential building permit page, Garden City routes an application for review only once the complete package and the required fees are in. Design-build helps here, because drawings, engineering, and fees are assembled together before we submit.",
        },
      ],
    },
  },
  "adu": {
    "boise": {
      intro: "Detached ADUs and guest houses in Boise add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Boise and Ada County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Boise?", answer: "ADU cost in Boise depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Boise have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Boise or Ada County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Boise?", answer: "Yes. Boise is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Boise?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Boise?", answer: "Property inside Boise city limits is permitted by the city building office; unincorporated addresses go through Ada County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
    "meridian": {
      intro: "Detached ADUs and guest houses in Meridian add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Meridian and Ada County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Meridian?", answer: "ADU cost in Meridian depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Meridian have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Meridian or Ada County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Meridian?", answer: "Yes. Meridian is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Meridian?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Meridian?", answer: "Property inside Meridian city limits is permitted by the city building office; unincorporated addresses go through Ada County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
    "eagle": {
      intro: "Detached ADUs and guest houses in Eagle, including Banbury, add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Eagle and Ada County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Eagle?", answer: "ADU cost in Eagle depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Eagle have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Eagle or Ada County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Eagle?", answer: "Yes. Eagle is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Eagle?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Eagle?", answer: "Property inside Eagle city limits is permitted by the city building office; unincorporated addresses go through Ada County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
    "nampa": {
      intro: "Detached ADUs and guest houses in Nampa add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Nampa and Canyon County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Nampa?", answer: "ADU cost in Nampa depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Nampa have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Nampa or Canyon County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Nampa?", answer: "Yes. Nampa is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Nampa?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Nampa?", answer: "Property inside Nampa city limits is permitted by the city building office; unincorporated addresses go through Canyon County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
    "kuna": {
      intro: "Detached ADUs and guest houses in Kuna add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Kuna and Ada County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Kuna?", answer: "ADU cost in Kuna depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Kuna have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Kuna or Ada County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Kuna?", answer: "Yes. Kuna is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Kuna?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Kuna?", answer: "Property inside Kuna city limits is permitted by the city building office; unincorporated addresses go through Ada County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
    "star": {
      intro: "Detached ADUs and guest houses in Star add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Star and Ada County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Star?", answer: "ADU cost in Star depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Star have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Star or Ada County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Star?", answer: "Yes. Star is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Star?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Star?", answer: "Property inside Star city limits is permitted by the city building office; unincorporated addresses go through Ada County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
    "middleton": {
      intro: "Detached ADUs and guest houses in Middleton add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Middleton and Canyon County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Middleton?", answer: "ADU cost in Middleton depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Middleton have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Middleton or Canyon County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Middleton?", answer: "Yes. Middleton is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Middleton?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Middleton?", answer: "Property inside Middleton city limits is permitted by the city building office; unincorporated addresses go through Canyon County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
    "caldwell": {
      intro: "Detached ADUs and guest houses in Caldwell add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Caldwell and Canyon County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Caldwell?", answer: "ADU cost in Caldwell depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Caldwell have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Caldwell or Canyon County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Caldwell?", answer: "Yes. Caldwell is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Caldwell?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Caldwell?", answer: "Property inside Caldwell city limits is permitted by the city building office; unincorporated addresses go through Canyon County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
    "garden-city": {
      intro: "Detached ADUs and guest houses in Garden City add a new, separate dwelling on a lot you already own. Boise Construction Co builds new detached accessory dwellings for Garden City and Ada County; garage, basement and interior conversions are remodeling work for Boise Remodeling Co. Boise ADU Co projects currently run through Boise Construction Co; that brand site is coming. Feasibility comes first: access, utilities, setbacks, and local requirements shape the plan before design. Request a quote and we reply within one business day with next steps.",
      faqs: [
        { question: "How much does adus & guest houses cost in Garden City?", answer: "ADU cost in Garden City depends on size, existing conditions, utility connections, site work, and finishes. We price after a site review rather than publishing a single square-foot number that hides those variables." },
        { question: "Can every property in Garden City have an ADU?", answer: "No. Feasibility depends on the parcel, setbacks, utilities, and Garden City or Ada County requirements. A site-specific review is needed before confirming what can be built." },
        { question: "Do you build detached ADUs and conversions?", answer: "We build new detached ADUs and guest houses. Garage conversions and basement or interior units are remodeling work inside the existing house, which our sister company Boise Remodeling Co handles. The suitable route depends on your lot and how the space will be used." },
        { question: "Do you build in Garden City?", answer: "Yes. Garden City is inside our Treasure Valley service area, and ADU projects there run through Boise Construction Co." },
        { question: "How do I get a budget for adus & guest houses in Garden City?", answer: "Request a quote with the address, intended use, and any photos or plans. We reply within one business day and schedule a site review before writing a line-item budget." },
        { question: "Who permits an ADU in Garden City?", answer: "Property inside Garden City city limits is permitted by the city building office; unincorporated addresses go through Ada County. We check jurisdiction at the first visit and handle permits in-house." },
      ],
    },
  },
};

export function getCityServiceCopy(serviceSlug: string, citySlug: string): CityServicePageCopy | undefined {
  return CITY_SERVICE_COPY[serviceSlug]?.[citySlug];
}
