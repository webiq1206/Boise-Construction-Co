/**
 * Marketing image paths. These point at project photography in
 * `public/images/`. Replace with your own photos using the same filenames
 * (or update the paths here) - .jpg or .webp also work.
 */

export const SITE_IMAGES = {
  /** Homepage hero - modern farmhouse exterior at golden hour; same photo the
      Custom Home Building service card uses (owner picked it for the hero). */
  hero: "/images/construction/custom-home-exterior.webp",
  /** Design-build / plan review split panels. */
  process: "/images/process-design-review.webp",
  /** "Where your money goes" value band - a carpenter setting custom cabinetry,
   *  reinforcing that the budget is spent on craftsmanship, not overhead. */
  valueCraft: "/images/value-craftsmanship-cabinetry.webp",
  /** A house being framed - process sections. */
  processInProgress: "/images/framing-in-progress.webp",
  /** Full-bleed brand statement band. */
  statementBand: "/images/statement-great-room.webp",
  /** About/contact split panels and about hero. */
  // Not the shared crew photo: that one shows Boise Remodeling Co shirts, which
  // is the wrong company on this site. A real Construction Co team photo goes here.
  leadership: "/images/framing-in-progress.webp",
  /** Consultation section background (homepage). */
  consultBg: "/images/consult-lifestyle.webp",
  /** Budget section subtle texture - island detail crop. */
  budgetDetail: "/images/budget-kitchen-detail.webp",
} as const;

/**
 * The construction image library in public/images/construction, keyed by what
 * each photograph actually shows.
 *
 * Service pages, city-service pages, and the blog and guide hero registry all
 * draw from this one set, so a page never ends up illustrated with a stage of
 * construction it is not about. It lives here rather than beside either
 * consumer because both serviceBackgrounds and cityServiceImages need it and
 * they already depend on this module.
 */
const c = (name: string) => `/images/construction/${name}.webp`;

export const CONSTRUCTION_IMAGES = {
  customHome: c("custom-home-exterior"),
  semiCustom: c("semi-custom-home"),
  framing: c("home-under-framing"),
  foundation: c("foundation-and-excavation"),
  roughIn: c("mechanical-rough-in"),
  insulation: c("insulation-and-air-sealing"),
  interior: c("new-home-interior"),
  kitchen: c("new-home-kitchen"),
  lot: c("buildable-lot"),
  foothills: c("foothills-building-site"),
  ruralSite: c("rural-site-work"),
  plans: c("plans-and-selections"),
  budget: c("line-item-budget"),
  meeting: c("site-meeting"),
  outdoor: c("covered-outdoor-living"),
  shopHome: c("shop-home-barndominium"),
} as const;