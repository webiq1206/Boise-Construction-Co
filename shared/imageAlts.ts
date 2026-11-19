import { localAlt, type LocalAltContext } from './localAlt';

/**
 * Alt text for content photographs, written from what each file shows.
 * Decorative backgrounds and brand marks are intentionally absent: those stay
 * empty and aria-hidden at the call site.
 *
 * /images/construction/mechanical-rough-in.webp and
 * /family/construction-mechanical-rough-in.webp share one rough-in description.
 *
 * Paths that are byte-identical share one description.
 */
const ALTS: Record<string, string> = {
  "/images/construction/foothills-two-story-home.webp":
    "Two-story house with dark vertical siding and a covered wood entry on a sagebrush hillside",
  "/images/construction/gable-entry-single-story-home.webp":
    "Single-story house with a wood-clad gable entry, a dark metal roof and a lawn, with dry foothills behind",
  "/images/construction/single-story-home-at-dusk.webp":
    "Single-story white stucco house with a dark metal roof and lit windows at dusk",
  "/images/construction/hillside-two-story-home-at-dusk.webp":
    "Two-story house with dark siding, a wood-clad entry and lit windows at dusk, with dry foothills behind",
  "/images/construction/two-story-home-street-view.webp":
    "Two-story house with gray siding, a wood accent bay and an attached garage, with dry foothills behind",
  "/images/construction/rear-covered-patio.webp":
    "Covered rear patio with a wood ceiling on steel posts, opening from a living room onto a lawn",
  "/images/construction/kitchen-with-dark-island.webp":
    "White kitchen with a dark island, three stools and stainless steel appliances",
  "/images/construction/oak-kitchen-with-pendants.webp":
    "Kitchen with oak cabinets, a dark island with four wood stools and black pendant lights",
  "/images/construction/living-room-linear-fireplace.webp":
    "Living room with a linear fireplace, a light sofa and two tall windows facing the foothills",
  "/images/construction/primary-bath-freestanding-tub.webp":
    "Bathroom with a freestanding tub, a glass shower and a long oak vanity beside a window onto dry hills",
  "/images/construction/shop-building-rural-lot.webp":
    "Dark metal shop building with two overhead doors and a covered entry on a rural gravel lot",
  "/images/construction/detached-two-bay-garage.webp":
    "Detached dark metal garage with two overhead doors and a side entry door",
  "/images/construction/rear-room-addition.webp":
    "Single-story addition with dark siding, sliding glass doors and a small patio",
  "/images/construction/second-story-addition-framing.webp":
    "Second-story addition being framed above a single-story house, with scaffolding at one end",
  "/images/construction/attached-garage-addition.webp":
    "Attached garage addition with dark siding and a concrete driveway below dry hills",
  "/images/construction/sunroom-addition.webp":
    "Sunroom addition with black-framed glass walls, two armchairs and a view of the foothills",
  "/images/construction/room-addition-under-construction.webp":
    "Room addition under construction with exposed framing beside a house with gray siding",
  "/images/construction/white-backyard-adu.webp":
    "White backyard cottage with a dark metal roof, a wood entry and a cedar fence",
  "/images/construction/dark-sided-adu.webp":
    "Small dark-sided cottage with a metal roof, a wood door and a stone path through dry grasses",
  "/images/construction/backyard-studio-adu.webp":
    "Backyard studio with gray vertical siding, a wood-clad entry and a stepping-stone path",
  "/images/construction/detached-adu-wood-entry.webp":
    "Detached backyard unit with dark vertical siding and a wood-clad entry",
  "/images/construction/attached-adu-covered-entry.webp":
    "Attached unit with dark lap siding, a covered entry and concrete steps",
  "/images/construction/stucco-adu-cottage.webp":
    "Small stucco cottage with a dark metal roof beside a cedar fence",
  "/images/construction/garage-conversion-window-wall.webp":
    "Garage converted to living space with a large black-framed window wall",
  "/images/construction/custom-home-exterior.webp":
    "Two-story house with dark vertical siding, a wood-clad entry and a three-car garage, with dry foothills behind",
  // Not the same picture as /images/construction/custom-home-exterior.webp above.
  "/family/construction-custom-home-exterior.webp":
    "Mountain-modern home with charcoal stucco, ledgestone and a dark metal roof",
  "/images/construction/semi-custom-home.webp":
    "Single-story house with white siding, a dark gable bay, a small covered entry and an attached garage",
  "/images/construction/home-under-framing.webp":
    "Wood-framed house with roof trusses in place and stacked lumber on a gravel lot",
  "/images/construction/foundation-and-excavation.webp":
    "Concrete foundation walls in an excavated building pad, with rebar nearby",
  "/images/construction/new-home-kitchen.webp":
    "Kitchen with white cabinets, a wood island, and a light tile backsplash",
  "/images/construction/new-home-interior.webp":
    "Empty great room with a vaulted ceiling, a linear fireplace in a plaster wall, light wood floors and tall windows onto dry hills",
  "/images/construction/covered-outdoor-living.webp":
    "Covered patio with a wood ceiling on black steel posts, a dining table and a built-in grill counter beside a house",
  "/images/construction/site-meeting.webp":
    "Three people in hard hats standing outdoors reviewing a drawing, with a framed house behind them",
  "/images/construction/foothills-building-site.webp":
    "Graded hillside building pad with a rock retaining wall and an unpaved access road",
  "/images/construction/plans-and-selections.webp":
    "Floor plan and front elevation drawings with a scale ruler, pencil, and wood, stone and paint samples",
  "/images/construction/line-item-budget.webp":
    "Printed budget pages and a small wood house model on a desk",
  "/images/construction/buildable-lot.webp":
    "Open grassy lot with a survey stake, fence posts, and overhead power lines",
  "/images/construction/rural-site-work.webp":
    "Rural dirt work site with a trench, excavated soil, a yellow excavator, and a well-drilling rig",
  "/images/construction/shop-home-barndominium.webp":
    "Dark metal building with two tall shop doors and an attached living wing on a rural lot",
  "/images/construction/insulation-and-air-sealing.webp":
    "Wall studs filled with insulation and sealed at the edges before drywall",
  "/images/construction/mechanical-rough-in.webp":
    "Mechanical rough-in with pipes and wiring inside framed walls",
  "/family/construction-mechanical-rough-in.webp":
    "Mechanical rough-in with pipes and wiring inside framed walls",
  "/images/construction/great-room-evening.webp":
    "Living room with a gray sofa, a low fireplace in a pale stone wall, large windows onto a back yard and a kitchen island behind",
  "/family/construction-great-room-evening.webp":
    "Living room with a gray sofa, a low fireplace in a pale stone wall, large windows onto a back yard and a kitchen island behind",
  "/images/framing-in-progress-branded.webp":
    "A worker kneeling beside interior wall framing on a plywood subfloor, with a drill and tape measure nearby",
  "/family/p5-p5-construction-branded.webp":
    "A worker kneeling beside interior wall framing on a plywood subfloor, with a drill and tape measure nearby",
  "/family/construction-budget-kitchen-detail.webp":
    "Close-up of a white marble waterfall countertop over a light oak Shaker cabinet door",
  "/images/budget-kitchen-detail.webp":
    "Close-up of a white marble waterfall countertop over a light oak Shaker cabinet door",
  "/family/p5-p5-hero.webp":
    "House with wood and charcoal siding and a dark metal roof on a hillside at dusk, with valley lights below",
  "/images/areas/boise.webp":
    "Street of two-story homes in light stucco and dark siding, lined with young trees, with grassy foothills behind",
  "/images/areas/meridian.webp":
    "Two-story house with white stucco, dark siding, an attached garage and a front lawn",
  "/images/areas/eagle.webp":
    "Single-story white stucco house with dark metal roofs and lit windows at dusk, set in gravel and ornamental grasses",
  "/images/areas/nampa.webp":
    "Single-story stucco house with a wood-clad entry and an attached garage on a new street, with open valley land behind",
  "/images/areas/kuna.webp":
    "Single-story gray stucco house with a dark metal roof and a wood-clad entry on open sagebrush land, with mountains behind",
  "/images/areas/star.webp":
    "Two-story house with dark vertical siding and a covered patio on a lawn beside a tree-lined river",
  "/images/areas/middleton.webp":
    "Two-story house with light siding below and dark siding above, on a lawn beside open fields and a row of trees",
  "/images/areas/caldwell.webp":
    "Single-story stucco house with a dark garage bay, with vineyard rows on the slope behind",
  "/images/projects/eagle-farmhouse-exterior.webp":
    "Single-story house with gray stucco, a wood-clad central gable and a dark metal roof, with dry foothills behind",
  "/images/projects/eagle-farmhouse-great-room.webp":
    "Great room with a vaulted ceiling, a linear fireplace, and black-framed sliding doors looking to foothills",
  "/images/projects/eagle-farmhouse-kitchen.webp":
    "Kitchen with white cabinets, a wood island, and a foothills view through a black-framed window",
  "/images/projects/eagle-farmhouse-bath.webp":
    "Primary bath with a freestanding tub beside a black-framed window overlooking foothills",
  "/images/projects/eagle-farmhouse-outdoor.webp":
    "Covered back patio with a wood ceiling on black steel posts and sliding glass doors, with foothills behind the house",
  "/images/projects/meridian-ranch-exterior.webp":
    "Single-story house with dark horizontal siding, a light panel accent and an attached garage on a lawn",
  "/images/projects/meridian-ranch-living.webp":
    "Living room with light floors, a low fireplace in a pale tiled wall, and windows onto a fenced back lawn",
  "/images/projects/meridian-ranch-kitchen.webp":
    "Open kitchen with white cabinets, pale counters, and a window to a suburban yard",
  "/images/projects/meridian-ranch-bath.webp":
    "Hall bath with a light wood vanity, a white tiled tub and shower, and a frosted window",
  "/images/projects/eagle-mountain-modern/eagle-custom-home-front-exterior.webp":
    "Mountain-modern custom home with charcoal stucco, ledgestone, and dark standing-seam roof",
  "/images/projects/eagle-mountain-modern/eagle-custom-home-rear-patio.webp":
    "Cantilevered covered patio with cedar soffit facing a sage foothills slope",
  "/images/projects/eagle-mountain-modern/eagle-custom-home-great-room.webp":
    "Great room with black steel window wall, white oak floor, and ledgestone fireplace",
  "/images/projects/eagle-mountain-modern/eagle-custom-home-kitchen.webp":
    "Kitchen with rift-cut white oak cabinets and a honed black quartzite island",
  "/images/projects/eagle-mountain-modern/eagle-custom-home-primary-bath.webp":
    "Primary bath with limestone tile, freestanding tub, and floating white oak vanity",
  "/images/projects/eagle-mountain-modern/eagle-custom-home-framing.webp":
    "Timber framing on a foothills lot",
  "/images/projects/eagle-mountain-modern/eagle-custom-home-lot-before.webp":
    "Open foothills lot with sage slope and survey stakes",
  "/images/about/perkins-family-meridian-idaho.webp":
    "Nick Perkins with his wife and five children at a pumpkin patch in Meridian, Idaho",
  "/images/about/perkins-family-meridian-idaho-1x1.webp":
    "Nick Perkins with his wife and five children at a pumpkin patch in Meridian, Idaho",
  "/images/about/perkins-family-meridian-idaho-4x3.webp":
    "Nick Perkins with his wife and five children at a pumpkin patch in Meridian, Idaho",
  "/images/about/perkins-family-portrait.webp":
    "The Perkins family, Nick, his wife and their five children, on a beach",
  "/images/projects/treasure-valley-adu-finished.webp":
    "Finished modern ADU with standing-seam metal roof beside a Treasure Valley home",
  "/family/p5-p5-adu.webp":
    "Finished modern ADU with standing-seam metal roof beside a Treasure Valley home",
  "/images/projects/boise-craftsman-exterior.webp":
    "Two-story white stucco house with a dark siding accent, a wood-clad covered entry and an attached garage",
  "/images/projects/boise-craftsman-foyer.webp":
    "Entry hall with a glass front door and sidelights, a wood slat wall, and a staircase with wood treads",
  "/images/projects/boise-craftsman-kitchen.webp":
    "Kitchen with light wood lower cabinets, white upper cabinets, an island with three stools, and a large window",
  "/images/projects/boise-craftsman-living.webp":
    "Family room with a linear fireplace in a white wall, a sofa and armchair, and tall windows onto trees",
};

/** What the picture shows, with no local wording. Empty for a file with no description. */
export function imageDescription(src: string | undefined | null): string {
  if (!src) return "";
  const path = src.split("?")[0].split("#")[0];
  return ALTS[path] ?? "";
}

const CITY_BY_SLUG: Record<string, string> = {
  boise: "Boise", meridian: "Meridian", eagle: "Eagle", nampa: "Nampa", kuna: "Kuna", star: "Star",
  middleton: "Middleton", caldwell: "Caldwell", "garden-city": "Garden City",
};

/** The city an area photograph belongs to, read from its path. */
function cityFromPath(path: string): string | undefined {
  const area = path.match(/\/areas\/([^./]+)\.webp$/);
  return area ? CITY_BY_SLUG[area[1]] : undefined;
}

/**
 * The alt for a content photograph: the work and the place, then what the
 * picture shows (shared/localAlt.ts). Pass the page's own service and city;
 * without them an area photograph names its own city and Boise is the place.
 * Empty when the file has no description, so a call site can fall back.
 */
export function contentImageAlt(src: string | undefined | null, context?: LocalAltContext): string {
  const description = imageDescription(src);
  if (!description) return "";
  const path = (src as string).split("?")[0].split("#")[0];
  return localAlt(description, { subject: context?.subject, city: context?.city ?? cityFromPath(path) });
}
