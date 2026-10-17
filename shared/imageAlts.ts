/**
 * Alt text for content photographs, written from what each file shows.
 * Decorative backgrounds and brand marks are intentionally absent: those stay
 * empty and aria-hidden at the call site.
 *
 * /images/construction/mechanical-rough-in.webp (same file as
 * /family/construction-mechanical-rough-in.webp) is also absent. Two looks at
 * the file disagreed, so it keeps an empty alt where it had none.
 *
 * Paths that are byte-identical share one description.
 */
const ALTS: Record<string, string> = {
  "/images/construction/custom-home-exterior.webp":
    "White board-and-batten house with a dark gable roof and a covered front porch",
  "/family/construction-custom-home-exterior.webp":
    "White board-and-batten house with a dark gable roof and a covered front porch",
  "/images/construction/semi-custom-home.webp":
    "Single-story house with light horizontal siding, dark shutters, and a covered entry on a subdivision lot",
  "/images/construction/home-under-framing.webp":
    "Wood-framed house with roof trusses in place and a worker on the roof deck",
  "/images/construction/foundation-and-excavation.webp":
    "Concrete foundation walls in an excavated building pad with gravel and a worker nearby",
  "/images/construction/new-home-kitchen.webp":
    "Kitchen with white cabinets, a wood island, and a light tile backsplash",
  "/images/construction/new-home-interior.webp":
    "Open living area with a wood ceiling, stone fireplace, and windows along one wall",
  "/images/construction/covered-outdoor-living.webp":
    "Covered outdoor patio with a wood ceiling, dining table, and kitchen counter beside a house",
  "/images/construction/site-meeting.webp":
    "Three people at a table outdoors reviewing drawings, with a framed house behind them",
  "/images/construction/foothills-building-site.webp":
    "Graded hillside building pad with a rock retaining wall and an unpaved access road",
  "/images/construction/plans-and-selections.webp":
    "Architectural floor plans, finish samples, and a laptop on a work table",
  "/images/construction/line-item-budget.webp":
    "Printed budget pages and a small wood house model on a desk",
  "/images/construction/buildable-lot.webp":
    "Open grassy lot with a survey stake, fence posts, and overhead power lines",
  "/images/construction/rural-site-work.webp":
    "Rural dirt work site with a trench, excavated soil, and a yellow excavator",
  "/images/construction/shop-home-barndominium.webp":
    "Metal building with a large shop bay and an attached living wing on a rural lot",
  "/images/construction/insulation-and-air-sealing.webp":
    "Wall studs filled with insulation and sealed at the edges before drywall",
  "/images/construction/great-room-evening.webp":
    "Living room with a stone fireplace, wood ceiling beams, and large windows at dusk",
  "/family/construction-great-room-evening.webp":
    "Living room with a stone fireplace, wood ceiling beams, and large windows at dusk",
  "/images/framing-in-progress-branded.webp":
    "A worker beside exterior wall framing, with stacked lumber and a concrete slab on a new-home site",
  "/family/p5-p5-construction-branded.webp":
    "Framed house on a building site with a worker in a hard hat checking the structure",
  "/family/construction-budget-kitchen-detail.webp":
    "Kitchen counter with material samples, a notebook, and a tablet showing a floor plan",
  "/images/budget-kitchen-detail.webp":
    "Kitchen counter with material samples, a notebook, and a tablet showing a floor plan",
  "/family/p5-p5-hero.webp":
    "Kitchen with white cabinets, a wood island, and large windows",
  "/images/areas/boise.webp":
    "Light-colored two-story houses with dark roofs along a wide suburban street",
  "/images/areas/meridian.webp":
    "Houses with light siding and dark roofs along a curving street lined with young trees",
  "/images/areas/eagle.webp":
    "Large homes with varied rooflines along a wide paved suburban street",
  "/images/areas/nampa.webp":
    "Houses with light siding and dark roofs along a straight suburban street",
  "/images/areas/kuna.webp":
    "Houses with light siding and dark roofs along a suburban street with a sidewalk",
  "/images/areas/star.webp":
    "A single-story house with light siding and a dark roof on a wide suburban lot",
  "/images/areas/middleton.webp":
    "A two-story house with light siding and a dark roof beside a lawn and sidewalk",
  "/images/areas/caldwell.webp":
    "Houses with light siding and dark roofs along a suburban street with sidewalks",
};

export function contentImageAlt(src: string | undefined | null): string {
  if (!src) return "";
  const path = src.split("?")[0].split("#")[0];
  const description = ALTS[path] ?? "";
  if (!description) return "";
  return `Representative image: ${description}`;
}
