/**
 * Marketing image paths. These point at representative design imagery in
 * `public/images/`. Replace with your own photos using the same filenames
 * (or update the paths here) - .jpg or .webp also work.
 */

export const SITE_IMAGES = {
  /** Interior-page hero (areas, contact) - dark-sided two-story house with a
      wood-clad entry in daylight; same photo the Custom Home Building service
      card uses. */
  hero: "/images/construction/custom-home-exterior.webp",
  /** Design-build / plan review split panels. */
  process: "/images/construction/plans-and-selections.webp",
  /** "Where your money goes" value band - mechanical rough-in with pipes and wiring. */
  valueCraft: "/images/construction/mechanical-rough-in.webp",
  /** A house being framed - process sections. */
  processInProgress: "/images/framing-in-progress-branded.webp",
  /** Full-bleed brand statement band. */
  statementBand: "/images/construction/great-room-evening.webp",
  /** About/contact split panels and about hero. */
  // Not the shared crew photo: that one shows Boise Remodeling Co shirts, which
  // is the wrong company on this site. A real Construction Co team photo goes here.
  leadership: "/images/framing-in-progress-branded.webp",
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
  /** Finished Treasure Valley ADU - never use empty-lot photos for ADU pages. */
  adu: "/images/projects/treasure-valley-adu-finished.webp",
  foothills: c("foothills-building-site"),
  ruralSite: c("rural-site-work"),
  plans: c("plans-and-selections"),
  budget: c("line-item-budget"),
  meeting: c("site-meeting"),
  outdoor: c("covered-outdoor-living"),
  shopHome: c("shop-home-barndominium"),
  // Owner's Photo Dump, added 19 November 2026 so city pages stop sharing pictures.
  foothillsHome: c("foothills-two-story-home"),
  gableEntryHome: c("gable-entry-single-story-home"),
  homeAtDusk: c("single-story-home-at-dusk"),
  hillsideHomeDusk: c("hillside-two-story-home-at-dusk"),
  twoStoryStreet: c("two-story-home-street-view"),
  rearPatio: c("rear-covered-patio"),
  islandKitchen: c("kitchen-with-dark-island"),
  oakKitchen: c("oak-kitchen-with-pendants"),
  fireplaceRoom: c("living-room-linear-fireplace"),
  primaryBath: c("primary-bath-freestanding-tub"),
  shopBuilding: c("shop-building-rural-lot"),
  detachedGarage: c("detached-two-bay-garage"),
  additionRear: c("rear-room-addition"),
  additionSecondStory: c("second-story-addition-framing"),
  additionGarage: c("attached-garage-addition"),
  additionSunroom: c("sunroom-addition"),
  additionFraming: c("room-addition-under-construction"),
  aduBackyard: c("white-backyard-adu"),
  aduFoothills: c("dark-sided-adu"),
  aduStudio: c("backyard-studio-adu"),
  aduDetached: c("detached-adu-wood-entry"),
  aduAttached: c("attached-adu-covered-entry"),
  aduStucco: c("stucco-adu-cottage"),
  aduGarageConversion: c("garage-conversion-window-wall"),
} as const;