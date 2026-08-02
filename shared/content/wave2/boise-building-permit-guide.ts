import type { BlogPostData } from '../../blogContent';

export const boiseBuildingPermitGuide: BlogPostData = {
  slug: 'boise-building-permit-guide',
  title: 'Building Permits in Boise: What a New Home Needs',
  seoTitle: 'Building Permits in Boise: New Home Guide',
  metaDescription:
    'What a new-home building permit in Boise actually contains: site plan, architectural set, structural engineering, energy compliance, utility approvals, inspections.',
  excerpt:
    'A new-home permit is a package, not a form. Here is what goes into it, who submits it, what plan review looks for, and how inspections run through the build.',
  category: 'The Building Process',
  hubSlug: 'home-building-process',
  author: 'Boise Construction Co',
  publishedAt: '2026-06-15',
  tags: ['permits', 'new construction', 'boise', 'building process'],
  heroImage: '/images/blog/boise-building-permit-guide.webp',
  primaryKeyword: 'boise building permit new home',
  secondaryKeywords: [
    'new home building permit boise',
    'what does a building permit include',
    'ada county building permit house',
  ],
  searchIntent: 'informational',
  featuredSnippetTargets: [
    'what does a new home building permit include',
    'boise building permit requirements',
  ],
  wordCountTarget: 'cluster',
  quickAnswer:
    'A new-home building permit in the Boise area requires a complete package: a site plan, a full architectural drawing set, structural engineering, energy code compliance documentation, and utility or septic approvals. Your builder submits it, the jurisdiction reviews it, and inspections continue through construction until a certificate of occupancy is issued.',
  keyTakeaways: [
    'A new-home permit is a document package, not a single application form.',
    'Structural engineering and energy compliance are separate deliverables inside that package.',
    'Your builder should submit and manage the permit, not hand you a checklist.',
    'Plan review checks code compliance, zoning and setbacks, structure, and energy.',
    'Inspections gate the build: framing, rough-ins, insulation, and final all have to pass.',
    'The certificate of occupancy, not the final inspection, is what legally lets you move in.',
  ],
  relatedLinks: [
    { url: '/guides/boise-home-building-process-guide', anchor: 'The Boise Home Building Process' },
    { url: '/blog/ada-vs-canyon-county-permit-timelines', anchor: 'Ada vs Canyon County' },
    { url: '/blog/how-long-does-it-take-to-build-a-house-boise', anchor: 'How Long a Boise Build Takes' },
    { url: '/blog/stages-of-building-a-house', anchor: 'The Stages of Building a House' },
    { url: '/services/design-build', anchor: 'Design-Build' },
    { url: '/contact', anchor: 'Contact' },
  ],
  faqs: [
    {
      question: 'What documents do I need for a new home building permit in Boise?',
      answer:
        'A site plan showing the house, setbacks, driveway, and drainage; a complete architectural drawing set; structural engineering with calculations; energy code compliance documentation; and proof of utility service or an approved septic design. Rural parcels add a well and septic approval through Central District Health. Additional approvals apply if a highway district approach or an irrigation easement is involved.',
    },
    {
      question: 'Who pulls the building permit, me or the builder?',
      answer:
        'Your builder should. We handle permits, plan review responses, engineering coordination, and utility applications in-house for Ada and Canyon County. A homeowner who pulls their own permit takes on responsibility for code compliance and inspection scheduling, which is rarely a good trade even when a builder offers it as a way to save a line item.',
    },
    {
      question: 'How long does plan review take?',
      answer:
        'It varies with the jurisdiction and its current volume, so we plan in weeks rather than promising a date. What we can control is submitting a complete, coordinated set the first time, because the biggest schedule risk is a correction cycle that sends the drawings back and puts them at the end of the queue again.',
    },
    {
      question: 'What does the building permit cost?',
      answer:
        'Permit and impact fees vary by jurisdiction and by house size, so we price them from the current published schedules for your specific address rather than a rule of thumb. Design and engineering, which is a separate cost from the fees themselves, commonly runs 5 to 12 percent of construction cost, roughly $9,000 to $35,000, excluding land.',
    },
    {
      question: 'What inspections happen during construction?',
      answer:
        'The usual sequence is footing and foundation, underground plumbing, framing, then mechanical, electrical, and plumbing rough-ins, followed by insulation and energy, drywall in some cases, and a final inspection for each trade. Site-specific items like a septic system or a driveway approach are inspected by the agency that permitted them.',
    },
    {
      question: 'What is a certificate of occupancy?',
      answer:
        'It is the document that says the house is legally habitable. It is issued after all final inspections pass, and it is what lenders and insurers look for at closing. A final framing or electrical sign-off is not the same thing. You should not plan a move-in date that assumes occupancy before the certificate is in hand.',
    },
    {
      question: 'Can I start site work before the permit is issued?',
      answer:
        'Some jurisdictions allow limited early work such as a grading or excavation permit ahead of the full building permit, and some do not. It depends on the parcel and the agency, and it is worth asking rather than assuming. Starting structural work without an issued permit risks a stop-work order and having to uncover finished work for inspection.',
    },
  ],
  content: `
<h2 id="what-it-is">What a new-home permit actually is</h2>
<p><strong>A building permit for a new house is a package of engineered documents that a jurisdiction reviews and approves, not a form you fill out at a counter.</strong> That distinction explains most of what confuses people about permitting. You are not asking permission in the abstract. You are submitting a complete description of the house you intend to build, and a plans examiner is checking it against the building code, the zoning ordinance, and the energy code before anyone is allowed to dig.</p>
<p>Homes in Boise, Meridian, Eagle, Kuna, and Star permit through Ada County jurisdictions. Nampa, Caldwell, and Middleton permit through Canyon County jurisdictions. The document requirements are broadly similar across both. The portals, review cadence, and fee structures are not, which is covered separately in <a href="/blog/ada-vs-canyon-county-permit-timelines">Ada versus Canyon County</a>. This article is part of our <a href="/guides/boise-home-building-process-guide">Boise home building process guide</a>.</p>

<h2 id="the-package">What goes into the package</h2>
<p><strong>Five components make up the core of a new-dwelling submittal, and a missing one stops the whole thing.</strong> They are produced by different people at different times, which is exactly why permitting takes weeks rather than an afternoon.</p>
<table>
<thead><tr><th>Component</th><th>What it shows</th></tr></thead>
<tbody>
<tr><td>Site plan</td><td>House placement, setbacks, driveway and approach, easements, grading and drainage, well and septic locations where applicable</td></tr>
<tr><td>Architectural set</td><td>Floor plans, elevations, sections, details, window and door schedules, wall assemblies</td></tr>
<tr><td>Structural engineering</td><td>Foundation design, framing plans, beam and header sizing, shear and connection details, stamped calculations</td></tr>
<tr><td>Energy compliance</td><td>Insulation values, window performance, air sealing and duct testing approach, mechanical equipment efficiency</td></tr>
<tr><td>Utility and septic approvals</td><td>Water and sewer connection or an approved well and septic design, power and gas service, irrigation district sign-off where relevant</td></tr>
</tbody>
</table>
<p>Each of those has a lead time of its own. The engineer cannot stamp a structure that is still being redesigned, and the energy compliance path cannot be finalized until windows and the mechanical system are chosen. Coordinating those dependencies is most of what pre-construction is.</p>

<h2 id="site-plan">The site plan does more work than people expect</h2>
<p><strong>More permits stall on the site plan than on the house drawings.</strong> The architectural set is usually clean because it is drawn by people who draw houses. The site plan has to satisfy the zoning ordinance, the highway district, sometimes an irrigation district, sometimes a homeowners association, and the drainage requirements of the parcel, all at once.</p>
<p>Setbacks, lot coverage, and building height are the common friction points on a subdivision lot. On a rural parcel, the driveway approach, the septic drainfield location and its required separations, and stormwater retention all become site plan problems. Foothills lots add slope, access grade, and geotechnical requirements. A lot evaluation before you buy is the cheapest way to find these out; a written one runs $950 to $3,500 and has saved buyers considerably more than that.</p>

<h2 id="who-submits">Who submits it and who chases it</h2>
<p><strong>Your builder should own the permit from submittal through issuance, including every correction response.</strong> We handle permits, plan review, engineering coordination, and utility applications in-house across Ada and Canyon County, because the alternative is a homeowner learning a portal in the middle of a schedule that depends on it.</p>
<p>There is a version of this where a builder tells you to pull the permit yourself, usually framed as saving money. Be careful with it. The permit holder carries responsibility for code compliance and inspection scheduling, and it can complicate who is accountable if something fails inspection. Our <a href="/services/design-build">design-build</a> approach exists partly to keep this accountability in one place.</p>

<h2 id="plan-review">What plan review is actually looking for</h2>
<p><strong>Reviewers check four things: zoning and land use, structural adequacy, life safety and code compliance, and energy performance.</strong> They are not evaluating whether your house is well designed or good value. They are checking whether it is legal, safe, and buildable as drawn.</p>
<p>Zoning review confirms setbacks, height, lot coverage, and use. Structural review confirms that the engineering supports the spans, loads, and connections shown. Building code review looks at egress, stairs, guards, fire separations at the garage, ventilation, and similar. Energy review confirms the house meets the applicable energy code through either a prescriptive or performance path. Comments come back as a correction list, the design team responds, and the set is resubmitted. Correction cycles are normal. Multiple correction cycles usually mean the set was submitted before it was ready.</p>

<h2 id="fees">Fees, and why we do not quote them from memory</h2>
<p><strong>Permit fees and impact fees are set by each jurisdiction, revised periodically, and calculated from house size and valuation, so a number quoted from memory is a number that will be wrong.</strong> We pull the current published schedule for your specific address and put the real figure in your line-item budget before you sign anything.</p>
<p>What we can generalize: fees are a small share of a new-home budget compared with construction, but they are not trivial, and impact fees in particular differ meaningfully between jurisdictions. Design and engineering, which is separate from jurisdiction fees, commonly runs 5 to 12 percent of construction cost, or roughly $9,000 to $35,000, excluding land. Both belong in the budget from the start rather than appearing as a surprise later.</p>

<h2 id="inspections">The inspection sequence during construction</h2>
<p><strong>Inspections are checkpoints that gate the work behind them, which is why a failed one costs schedule rather than just a re-visit.</strong> The typical sequence for a new house runs like this.</p>
<table>
<thead><tr><th>Stage</th><th>What is inspected</th></tr></thead>
<tbody>
<tr><td>Footing and foundation</td><td>Excavation depth, rebar placement, forms, setbacks before concrete</td></tr>
<tr><td>Underground</td><td>Plumbing and any electrical below the slab, before it is covered</td></tr>
<tr><td>Framing</td><td>Structure, connections, shear, blocking, openings, roof framing</td></tr>
<tr><td>Rough-ins</td><td>Mechanical, electrical, and plumbing in open walls, usually separate inspections</td></tr>
<tr><td>Insulation and energy</td><td>Insulation coverage, air sealing, sometimes a blower door or duct test</td></tr>
<tr><td>Final</td><td>Completed trades, life safety devices, address and egress, site conditions</td></tr>
</tbody>
</table>
<p>Site-specific items are inspected by whoever permitted them. A septic system on a rural parcel is inspected by Central District Health, not the building department. A driveway approach may be inspected by the highway district. Coordinating several agencies onto one schedule is ordinary work for a builder and genuinely difficult for a homeowner doing it once.</p>

<h2 id="cover-up">Why nothing gets covered before it is inspected</h2>
<p><strong>The single most expensive permitting mistake is covering work before it has passed inspection.</strong> Drywall over an uninspected rough-in is not a paperwork problem. It is a demolition problem, because the inspector still needs to see what is behind it.</p>
<p>This is also why a builder's scheduling discipline matters more than it looks. Insulation and drywall crews are booked in advance and are expensive to reschedule, so there is real pressure to keep them moving. A builder who lets that pressure override the inspection sequence is trading a week now for a month later, and you will be the one paying for it.</p>

<h2 id="co">The certificate of occupancy</h2>
<p><strong>The certificate of occupancy is what legally makes the house habitable, and it comes after every final inspection has passed.</strong> Not after the last one you happened to watch, and not after the house looks finished. Lenders and insurers care about this document, and a closing date that assumes occupancy before it is issued is a date at risk.</p>
<p>Occasionally a jurisdiction will issue a temporary certificate when something outside the house, typically landscaping or final flatwork, cannot be completed because of the season. That is a normal accommodation, not a shortcut, and it comes with a deadline for finishing the outstanding items. We flag it in advance rather than at the closing table when a winter finish makes it likely.</p>

<h2 id="next-steps">Let us handle the paperwork</h2>
<p><strong>Permitting is the part of a build that rewards experience and punishes improvisation, which is why it belongs with your builder rather than on your desk.</strong> We assemble the package, submit it, answer corrections, coordinate the outside agencies, and schedule every inspection, then tell you where it stands in the weekly written update. For how permitting fits the wider calendar, see <a href="/blog/how-long-does-it-take-to-build-a-house-boise">how long a Boise build takes</a>, or <a href="/blog/stages-of-building-a-house">the stages of building a house in order</a>. When you want to talk through a specific parcel, <a href="/contact">reach out</a> and we will read it with you.</p>
`.trim(),
};
