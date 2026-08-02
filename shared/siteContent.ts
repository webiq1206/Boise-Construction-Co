import {
  ShieldCheck,
  MessageSquare,
  CalendarClock,
  Wallet,
  Hammer,
  HeartHandshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SITE_TAGLINE = "Treasure Valley home building, built on clarity and craftsmanship";

export const HERO_EYEBROW = "Boise Home Builder · Treasure Valley";

export const HERO_SUBHEAD =
  "One accountable design-build team from raw land to the keys in your hand.";

export const HERO_STATS = [
  { num: "60 sec", label: "Instant build cost range" },
  { num: "Free", label: "Planning consultation" },
  { num: "Line-item", label: "Budget before we break ground" },
] as const;

export const DIFFERENTIATORS_HEADLINE = "Built for people who want a real number, not a moving target";

export const DIFFERENTIATORS_INTRO =
  "Most people we meet have heard the same stories: a build that started at one price and finished at another, allowances set so low they were guaranteed to be blown, months of silence between updates. We built our process around the opposite. One accountable team, a line-item budget before we break ground, allowances set at what things actually cost here, and a written update every Friday.";

export interface Differentiator {
  title: string;
  body: string;
  contrast: string;
}

/** Top differentiators for homepage; full list on About. */
export const HOMEPAGE_DIFFERENTIATOR_INDICES = [0, 1, 2, 3, 4] as const;

export const DIFFERENTIATORS: Differentiator[] = [
  {
    title: "A line-item budget before we break ground",
    contrast: "Instead of a price per square foot that quietly changes once the foundation is in,",
    body: "you get a line-item budget covering every division of the build, from excavation to final grade. You can see what each part of your home costs, which means you can decide where to spend and where to pull back while it is still just a drawing.",
  },
  {
    title: "Allowances set at what things actually cost",
    contrast: "Rather than lowball allowances that make an early bid look competitive and then surface as overages,",
    body: "we set flooring, cabinetry, plumbing, and lighting allowances at real Treasure Valley pricing for the finish level you chose. If you spend to your allowance, you pay what the budget said.",
  },
  {
    title: "Your budget builds your home, not our overhead",
    contrast: "Instead of paying for big offices, model home parks, and fleets of trucks that quietly get built into your price,",
    body: "you get a company that runs lean on purpose. We put more of every dollar into the framing, the envelope, and the finishes, so more of what you spend ends up standing on your lot.",
  },
  {
    title: "One team, one point of accountability",
    contrast: "Instead of coordinating a designer, an architect, a builder, and a dozen subs who point at each other when something is wrong,",
    body: "you work with a single design-build team. Design, engineering, permitting, and construction stay under one roof, with the same project manager from your first consultation through the final walkthrough.",
  },
  {
    title: "Proactive communication, not radio silence",
    contrast: "Instead of driving by your lot to find out what happened this week,",
    body: "you receive a written update every Friday: what was completed, what is next, what your selections deadline looks like, and any decisions we need from you. Cost and schedule impacts get flagged early, while there is still room to react.",
  },
  {
    title: "Land and permit expertise before you commit",
    contrast: "Rather than discovering after closing that a parcel needs a well, a septic system, and three hundred feet of driveway,",
    body: "we evaluate lots before you buy. We handle Ada and Canyon County permitting in-house and build realistic approval timelines into your schedule from day one, rather than treating them as an afterthought.",
  },
  {
    title: "We work with your lender, not around them",
    contrast: "Instead of leaving you to translate between your bank and your builder,",
    body: "we provide the budgets, plans, and draw documentation construction-to-permanent lenders ask for, and we schedule inspections to match your draw milestones so financing does not become the thing that stalls your build.",
  },
  {
    title: "Confidence that outlasts the project",
    contrast: "Beyond a quick sign-off and goodbye,",
    body: "we stand behind our work with a written workmanship warranty and pass through every manufacturer warranty on what we install. Optional 3D visualization is available for clients who want certainty on layout and finish decisions before framing starts.",
  },
  {
    title: "Schedule changes communicated early",
    contrast: "Instead of finding out a milestone slipped after the fact,",
    body: "we build realistic timelines into your plan from day one, including the weather windows that genuinely affect foundation and flatwork in Idaho. When something moves, you hear it from us in writing.",
  },
  {
    title: "Craftsmanship you review before we close out",
    contrast: "Rather than rushing to the next job before you have had a chance to inspect the work,",
    body: "we walk the finished home with you and build a punch list together. Your selections are documented in the contract before construction, so what gets built matches what you approved.",
  },
];

/**
 * Headline credibility stats. Owner-provided facts about the business - keep
 * these accurate and update in one place. `established` is the founding year
 * (see shared/gbpProfile.ts GBP_NAP.founded).
 *
 * A completed-project count was deliberately removed in the move to new
 * construction: the prior "100+" figure reflected remodeling work and would
 * misrepresent home building experience. Add a count back only when there is a
 * real number of completed homes to cite.
 */
export const PROOF_STATS = {
  established: "2020",
} as const;

/**
 * Post-hero proof bar. Leads with the founding year, then the genuine trust
 * signals the business carries. No review counts, ratings, or project counts
 * until real ones exist. Keep labels concise and keep this at six entries so
 * the strip fills the six-column desktop grid in HeroSection.
 */
export const TRUST_ITEMS = [
  `Est. ${PROOF_STATS.established}`,
  "Design-Build",
  "Bonded · Insured",
  "Permits In-House",
  "Workmanship Warranty",
  "Free Consultation",
];

export const PROMISE_ITEMS = [
  {
    num: "01",
    title: "A budget you can actually read",
    body: "A line-item budget before we break ground, with allowances set at real local pricing, so you know what your home costs and where the money goes.",
  },
  {
    num: "02",
    title: "Proactive communication",
    body: "Every Friday: what was completed, what is next, and any decisions needed from you. One project manager from first consultation to final walkthrough.",
  },
  {
    num: "03",
    title: "A schedule you can plan around",
    body: "Realistic timelines built in from day one, including permitting and weather windows, with written notice when anything moves.",
  },
  {
    num: "04",
    title: "The workmanship warranty",
    body: "We stand behind the home we build with a written workmanship warranty, long after you have moved in.",
  },
];

export interface ClientPriority {
  title: string;
  body: string;
  icon: LucideIcon;
}

export const CLIENT_PRIORITIES: ClientPriority[] = [
  {
    title: "Trust and credibility",
    body: "Bonded and insured, permits handled in-house, and a signed scope and budget before anyone breaks ground.",
    icon: ShieldCheck,
  },
  {
    title: "Quality construction",
    body: "A tight building envelope, skilled trades, and a walkthrough of every finished detail before we hand over the keys.",
    icon: Hammer,
  },
  {
    title: "Clear communication",
    body: "Weekly written updates and one project manager who knows your build from the first consultation to closing.",
    icon: MessageSquare,
  },
  {
    title: "Staying on budget",
    body: "Line-item budgets, honest allowances, and written change orders before any additional work is performed.",
    icon: Wallet,
  },
  {
    title: "Staying on schedule",
    body: "Permitting, inspection, and construction milestones you can follow, with weather windows accounted for upfront.",
    icon: CalendarClock,
  },
  {
    title: "A process without the stress",
    body: "We coordinate the lender draws, the inspections, and the trades, so building a home does not become your second job.",
    icon: HeartHandshake,
  },
];

export const HOW_WE_BUILD_STEPS = [
  {
    number: "01",
    title: "Free planning consultation",
    desc: "We talk through what you want to build, where, and what it should cost. You leave with a realistic budget band and clear next steps. No obligation.",
  },
  {
    number: "02",
    title: "Land and feasibility review",
    desc: "Before you commit, we look at the lot: utilities, septic and well, slope, access, setbacks, and what the site work will realistically cost.",
  },
  {
    number: "03",
    title: "Design, selections, and a line-item budget",
    desc: "We develop plans and finish selections together, then price them line by line so you approve a real number before construction starts.",
  },
  {
    number: "04",
    title: "Permits and construction",
    desc: "We pull Ada and Canyon County permits in-house, coordinate inspections and lender draws, and send a written update every Friday.",
  },
  {
    number: "05",
    title: "Walkthrough and workmanship warranty",
    desc: "We walk the finished home with you and build the punch list together. If we built it and it fails from workmanship, we come back and fix it.",
  },
];

export const PRINCIPLES = [
  {
    title: "A real budget before we build",
    desc: "Every home starts with a line-item budget and documented selections, so you know exactly what you are buying before ground is broken.",
  },
  {
    title: "Written change orders only",
    desc: "If the scope changes mid-build, you get a written change order with a price before any additional work begins. Always.",
  },
  {
    title: "Allowances you can actually hit",
    desc: "We set allowances at what materials genuinely cost in this market, because an allowance you are guaranteed to blow is just a hidden overage.",
  },
  {
    title: "The site stays under control",
    desc: "Materials stored properly, the envelope protected from weather, and the lot kept clean. How a site is run shows up in the finished house.",
  },
  {
    title: "One PM, start to finish",
    desc: "Your project manager is the same person from the first consultation to the final walkthrough. You always know who to call.",
  },
  {
    title: "Workmanship warranty",
    desc: "We stand behind what we build with a written workmanship warranty, because we build homes meant to outlast us.",
  },
];

export const STANDARD_INCLUSIONS = [
  "All permits pulled in-house",
  "Dedicated project manager",
  "Line-item budget before construction",
  "Weekly written progress updates",
  "Lender draw and inspection coordination",
  "Written workmanship warranty",
];

export const OPTIONAL_ENHANCEMENTS = {
  title: "3D renderings and visualizations",
  body: "An optional design upgrade that lets you see the finished home before framing starts. It adds to the project investment and the design timeline, but for many clients it is what makes committing to a layout, a roofline, or a finish package feel like a decision rather than a gamble.",
  note: "Available on request during your design consultation.",
};

export const BUDGET_GUIDANCE_POINTS = [
  {
    title: "Planning ranges, then a real budget",
    body: "Our online estimator and your planning consultation produce a range based on size, finish level, site conditions, and current market pricing. That range narrows into a line-item budget once we have plans and selections.",
  },
  {
    title: "A line-item budget before construction",
    body: "Before we break ground, you receive a budget broken down by division, with allowances stated in writing. You can see what the foundation costs, what the cabinets cost, and where you have room to adjust.",
  },
  {
    title: "Site costs called out separately",
    body: "Driveways, well and septic, utility runs, retaining, and rock excavation vary enormously between lots. We price them as their own lines rather than burying them in a square-foot number.",
  },
  {
    title: "Change orders in writing",
    body: "Any change during construction requires a written change order with a price and a schedule impact, approved by you before the work is performed.",
  },
];

export const LEADERSHIP_COPY = {
  label: "Our commitment",
  headline: "Building a home should feel clear, not chaotic.",
  paragraphs: [
    "Boise Construction Co was built on a simple belief: people building a home in the Treasure Valley deserve a builder who prices honestly, communicates without being chased, and treats the process as something you should be able to understand.",
    "We know how builders usually get compared: a square-foot number, a glossy plan book, and allowances that quietly guarantee an overage. None of that tells you what your home will actually cost.",
    "So we do it the other way around. One accountable team, a line-item budget before we break ground, allowances set at real local pricing, weekly written updates while we build, and a team that answers the phone.",
  ],
  closing: "That is not a marketing promise. Every detail, every decision - handled with intention.",
};

export const FINANCING_BULLETS = [
  "Construction-to-permanent lender coordination",
  "Budgets and plans formatted for underwriting",
  "Draw schedules matched to build milestones",
  "Inspections scheduled around your draws",
  "Works alongside cash, lot equity, or wire",
];

export const CONSULT_BULLETS = [
  "No commission-driven salespeople",
  "No pressure to decide on the spot",
  "An honest budget band, in writing",
  "Response within one business day",
];

/**
 * Full-bleed cinematic statement band on the homepage - a photographic
 * "breather" that breaks the run of text sections below the estimator.
 * `accentWord` renders as the sage Fraunces accent (keep it to one word).
 */
export const STATEMENT_BAND = {
  eyebrow: "Our commitment",
  statement: "Every detail, every decision, handled with",
  accentWord: "intention",
  support:
    "One accountable team, a line-item budget before we break ground, and a written update every week, from your first consultation to the day you get the keys.",
} as const;

/**
 * "Where your money goes" positioning: as a lean, newer company we keep
 * overhead low and reinvest it in the work. Flagship homepage band placed just
 * before the estimator so it frames the pricing conversation. Editorial voice,
 * confident (not a "what you're not paying for" list).
 */
export const VALUE_MODEL = {
  eyebrow: "Where your money goes",
  headlineA: "Don't pay for our overhead.",
  headlineB: "Pay for your",
  accentWord: "home",
  costs: "Model home parks. Glossy plan books. Fleets of trucks. Layers of management.",
  costsBody: "Those costs don't disappear, they get built into your price per square foot.",
  reframe:
    "So we built our company differently. Every dollar you invest should end up standing on your lot, not covering our bills.",
  taglineLead: "Get more home for",
  taglineAccent: "what you spend",
} as const;
