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
    "White board-and-batten house with a dark gable roof and a covered front porch",
  "/family/construction-custom-home-exterior.webp":
    "White board-and-batten house with a dark gable roof and a covered front porch",
  "/images/construction/semi-custom-home.webp":
    "Single-story gray house with stone-wrapped porch columns, a covered entry and a garage",
  "/images/construction/home-under-framing.webp":
    "Wood-framed house with roof trusses in place and stacked lumber on a gravel lot",
  "/images/construction/foundation-and-excavation.webp":
    "Concrete foundation walls in an excavated building pad, with rebar nearby",
  "/images/construction/new-home-kitchen.webp":
    "Kitchen with white cabinets, a wood island, and a light tile backsplash",
  "/images/construction/new-home-interior.webp":
    "Open living area with a wood ceiling, stone fireplace, and windows along one wall",
  "/images/construction/covered-outdoor-living.webp":
    "Covered outdoor patio with a wood ceiling, dining table, and kitchen counter beside a house",
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
    "Metal building with a large shop bay and an attached living wing on a rural lot",
  "/images/construction/insulation-and-air-sealing.webp":
    "Wall studs filled with insulation and sealed at the edges before drywall",
  "/images/construction/mechanical-rough-in.webp":
    "Mechanical rough-in with pipes and wiring inside framed walls",
  "/family/construction-mechanical-rough-in.webp":
    "Mechanical rough-in with pipes and wiring inside framed walls",
  "/images/construction/great-room-evening.webp":
    "Living room with a stone fireplace, wood ceiling beams, and large windows at dusk",
  "/family/construction-great-room-evening.webp":
    "Living room with a stone fireplace, wood ceiling beams, and large windows at dusk",
  "/images/framing-in-progress-branded.webp":
    "A worker kneeling beside interior wall framing on a plywood subfloor, with a drill and tape measure nearby",
  "/family/p5-p5-construction-branded.webp":
    "A worker kneeling beside interior wall framing on a plywood subfloor, with a drill and tape measure nearby",
  "/family/construction-budget-kitchen-detail.webp":
    "Close-up of a white marble waterfall countertop over a light oak Shaker cabinet door",
  "/images/budget-kitchen-detail.webp":
    "Close-up of a white marble waterfall countertop over a light oak Shaker cabinet door",
  "/family/p5-p5-hero.webp":
    "Stone and stucco house with a metal roof at dusk, with foothills behind",
  "/images/areas/boise.webp":
    "Craftsman bungalow with a covered porch on a tree-lined street, with foothills behind",
  "/images/areas/meridian.webp":
    "Houses with light siding and dark roofs along a curving street lined with young trees",
  "/images/areas/eagle.webp":
    "Large stone house with a long curving driveway at sunset",
  "/images/areas/nampa.webp":
    "Single-story red brick ranch house with a wide lawn and young trees",
  "/images/areas/kuna.webp":
    "Single-story stone and board-and-batten house with a metal roof among sagebrush",
  "/images/areas/star.webp":
    "House with wood and stone siding on a lawn beside a tree-lined river",
  "/images/areas/middleton.webp":
    "A two-story house with light siding and a dark roof beside a lawn and sidewalk",
  "/images/areas/caldwell.webp":
    "Stucco house with a tile roof beside a vineyard",
  "/images/framing-foothills.webp":
    "New home framing with roof trusses and a lumber stack near the foothills",
  "/images/construction/bid-review-desk.webp":
    "Folders, a highlighter, a tape measure and a hard hat on a desk for reviewing bids",
  "/images/construction/single-story-farmhouse-exterior.webp":
    "White board-and-batten farmhouse with cedar porch posts, a metal porch roof and an attached garage, foothills behind",
  "/images/construction/mountain-modern-home-exterior.webp":
    "Mountain-modern house with log porch posts and beams, aligned upper and lower windows, and a lit living room",
  "/images/construction/great-room-timber-daylight.webp":
    "Great room with timber trusses, a dining table and chairs, and daylight through a gable window",
  "/images/construction/kitchen-alder-stone.webp":
    "Kitchen with alder cabinets, a stone range wall, a dark granite island and a window facing the hills",
  "/images/construction/material-choices.webp":
    "Oak flooring, tile, lumber, yellow tubing and stone samples on a jobsite table",
};

/** These descriptions are the rendered alt, with no added disclaimer. */
const PLAIN_ALT_PATHS = new Set<string>([
  "/images/framing-foothills.webp",
  "/images/construction/bid-review-desk.webp",
  "/images/construction/single-story-farmhouse-exterior.webp",
  "/images/construction/mountain-modern-home-exterior.webp",
  "/images/construction/great-room-timber-daylight.webp",
  "/images/construction/kitchen-alder-stone.webp",
  "/images/construction/material-choices.webp",
]);

export function contentImageAlt(src: string | undefined | null): string {
  if (!src) return "";
  const path = src.split("?")[0].split("#")[0];
  const description = ALTS[path] ?? "";
  if (!description) return "";
  if (PLAIN_ALT_PATHS.has(path)) return description;
  return `Representative image: ${description}`;
}
