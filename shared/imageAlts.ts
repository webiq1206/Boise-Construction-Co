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
    "Nick Perkins with his wife and five children at a pumpkin patch",
  "/images/about/perkins-family-meridian-idaho-1x1.webp":
    "Nick Perkins with his wife and five children at a pumpkin patch",
  "/images/about/perkins-family-meridian-idaho-4x3.webp":
    "Nick Perkins with his wife and five children at a pumpkin patch",
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

export function contentImageAlt(src: string | undefined | null): string {
  if (!src) return "";
  const path = src.split("?")[0].split("#")[0];
  const description = ALTS[path] ?? "";
  if (!description) return "";
  return description;
}
