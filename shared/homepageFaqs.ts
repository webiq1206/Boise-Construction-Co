export interface HomepageFaq {
  q: string;
  a: string;
}

/**
 * How many FAQs FAQSection renders by default before "Show all" - the
 * FAQPage schema (components/seo/HomePageSchema.tsx) must mark up only this
 * many, since the rest aren't in the page's HTML until that button is
 * clicked. Lives here (not in the client component) so a server component can
 * import it without crossing the client/server boundary.
 */
export const INITIAL_FAQ_COUNT = 8;

/**
 * Homepage FAQ set. These feed FAQPage schema, so answers lead with the direct
 * response before adding context.
 *
 * Cost figures must stay consistent with the anchors documented in
 * shared/seoContent.ts (roughly $225-$400 per finished square foot for 2026
 * Treasure Valley construction, excluding land) and with the estimator engine.
 */
export const HOMEPAGE_FAQS: HomepageFaq[] = [
  {
    q: "How much does it cost to build a house in Boise and the Treasure Valley?",
    a: "As of 2026, most Treasure Valley custom homes plan between $250 and $400 per finished square foot excluding land, which puts a 2,400 square foot home roughly between $600,000 and $960,000. Simpler single-level designs on flat valley lots can approach $225 per square foot, while foothills sites, steep grades, and highly detailed interiors regularly exceed $450. Land, site work, and utility connections are separate and vary more between lots than the house itself does, which is why we price them as their own lines rather than folding them into a square-foot number.",
  },
  {
    q: "How are you different from other home builders in the Treasure Valley?",
    a: "You get a line-item budget before we break ground, not a price per square foot that changes once the foundation is in. We set allowances for flooring, cabinetry, plumbing, and lighting at what those things genuinely cost here, so an allowance is not a hidden overage waiting to surface. We work as a true design-build firm, meaning design, engineering, permitting, and construction sit under one contract with one project manager, and we send a written update every Friday rather than waiting for you to call. Any change during construction requires a written change order with a price and a schedule impact before the work happens.",
  },
  {
    q: "Do I need to own land before I contact you?",
    a: "No. Roughly half the people we talk to are still looking. If you already own a lot or have one under contract, we can start with a feasibility review of that specific parcel. If you are still searching, we can evaluate a lot before you make an offer and tell you what the site work will realistically cost, which is the part most buyers underestimate. A cheap parcel that needs a well, a septic system, three hundred feet of driveway, and significant grading is often more expensive overall than a serviced lot that costs more up front.",
  },
  {
    q: "What is the difference between a custom home and a semi-custom home?",
    a: "A custom home starts from a blank page: the plan is drawn for your family and your specific lot. A semi-custom home starts from an existing plan we adapt, changing finishes, room configurations, and elevations without redrawing the structure from scratch. Semi-custom is typically faster to permit and less expensive because the engineering and design work is largely done, and it suits people who find a layout they like and want to personalize rather than originate it. Custom makes sense when the lot is unusual or your requirements do not map onto an existing plan.",
  },
  {
    q: "How long does it take to build a new home?",
    a: "Plan on 10 to 16 months from first consultation to move-in for most custom homes. That usually breaks down as two to four months of design and selections, one to three months for permitting through Ada or Canyon County, and seven to eleven months of construction. Semi-custom homes on an existing plan are often two to four months faster because the design and engineering are largely complete. Winter slows foundation and flatwork in Idaho rather than stopping the job, and we build those weather windows into the schedule rather than discovering them later.",
  },
  {
    q: "How does construction financing work, and do you help with it?",
    a: "Most clients use a construction-to-permanent loan, which funds the build in stages called draws and then converts to a standard mortgage at completion. We provide the budgets, plans, and draw documentation lenders ask for during underwriting, and we schedule inspections to line up with your draw milestones so financing does not stall the build. We are not a lender and do not originate loans, but we work with your bank throughout rather than leaving you to translate between the two.",
  },
  {
    q: "Do you handle permits?",
    a: "Yes. Permits are included in our scope and handled in-house. We work with the Ada and Canyon County offices regularly and build plan review and inspection windows into your schedule from day one rather than treating them as an afterthought. Beyond the building permit itself, new construction often needs separate approvals for driveway access, septic, or well, and we coordinate those as well.",
  },
  {
    q: "Can you build on land I already own?",
    a: "Yes, and it is one of the most common ways we work. We start by evaluating the parcel: utilities, septic and well feasibility, soil, slope, access, setbacks, and any covenants that affect what can be built. That review tells you what your site work will cost before you commit to a house plan, which matters because site costs vary far more between lots than construction costs do.",
  },
  {
    q: "What is included in the price, and what is an allowance?",
    a: "Your line-item budget covers every division of the build, from excavation and foundation through framing, mechanical systems, finishes, and final grade. Some categories are carried as allowances rather than fixed prices because you have not chosen the specific product yet, typically flooring, cabinetry, countertops, plumbing fixtures, lighting, and appliances. We set those allowances at real Treasure Valley pricing for the finish level you chose, so if you spend to your allowance you pay what the budget said. Spend above it and the difference appears as a change order before the work happens.",
  },
  {
    q: "What areas do you build in?",
    a: "We build across the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, along with the surrounding areas of Ada and Canyon County. If your lot sits just outside these areas, reach out and we will tell you honestly whether we can take it on.",
  },
  {
    q: "How does design-build compare to hiring an architect and a builder separately?",
    a: "With design-build, the designer, estimator, and construction lead work together from day one under one contract, so the plan gets priced as it is drawn rather than after. That tends to prevent the most common failure in the separate model, which is finishing a design you cannot afford and paying to have it redrawn. It also means one accountable party if something needs to change. Hiring separately can make sense when you want a specific architect for a highly unusual home, and it gives you an independent designer advocating for the design rather than the budget.",
  },
  {
    q: "Do you use your own crews or subcontractors?",
    a: "We employ a core in-house team for project management, design coordination, and site supervision. The specialized trades, including framing, mechanical, electrical, plumbing, and finish work, are performed by vetted trade partners we work with repeatedly on the same terms and standards. Your project manager stays your single point of contact regardless of who is on site on any given day.",
  },
  {
    q: "What is your workmanship warranty?",
    a: "We provide a written workmanship warranty on the home we build. If something we built or installed fails because of workmanship, rather than normal wear, deferred maintenance, or later modifications, we come back and fix it at no charge. We also pass through every manufacturer warranty on the products we install, including appliances, windows, roofing, and mechanical equipment.",
  },
  {
    q: "What does the free planning consultation include?",
    a: "A 60 to 90 minute conversation about what you want to build, where, and what it should realistically cost. We go through your lot or your lot search, the size and style you have in mind, your finish expectations, and your financing approach. You leave with a realistic budget band and clear next steps. There is no obligation and no commission-driven salesperson in the room, because we do not employ any.",
  },
];
