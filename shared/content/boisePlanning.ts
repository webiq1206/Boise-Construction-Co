import type { LandingSection } from '@/components/seo/LandingPageTemplate';

/** Boise-only planning content. Other area and city-service pages stay unchanged. */
export const BOISE_LOT_PLANNING: LandingSection = {
  heading: 'Before you commit to a Boise lot',
  paragraphs: [
    'Start with the parcel address or listing, not a finished floor plan. A Boise mailing address alone does not establish the permitting jurisdiction. Confirm whether the property is inside City of Boise limits or unincorporated Ada County before choosing the application checklist.',
    'Gather the information below for a lot evaluation. An infill parcel, a sloping foothills site and a lot with existing utility connections can raise different questions; the review needs to follow the actual property.',
  ],
  bullets: [
    'Parcel number, listing and any existing survey, with property boundaries, easements and access identified.',
    'Available water, sewer and power information, including which connections exist and which still need confirmation or pricing.',
    'Any existing soils, drainage or slope information. Conditions on a neighboring lot do not settle the conditions on yours.',
    'Recorded covenants and any HOA design requirements, checked separately from public planning and building approvals.',
  ],
  subsections: [
    {
      heading: 'Check records, then confirm the next step',
      paragraphs: [
        'The City of Boise permit portal lets you look up application records in the city system. A past permit is useful background, not confirmation that a different home design will be approved. Confirm current requirements with the department responsible for the parcel.',
        'If the lot is already chosen, our custom home building page explains how room needs, drawings, selections and the construction budget come together. If the land is still a question, start with lot evaluation before committing to a design.',
      ],
    },
  ],
  links: [
    { label: 'City of Boise permit and application records', href: 'https://permits.cityofboise.org/citizenaccess/Default.aspx' },
    { label: 'Lot evaluation and feasibility', href: '/services/lot-evaluation' },
    { label: 'Custom home building in Boise', href: '/services/custom-home-builder/boise' },
    { label: 'Boise home building guide', href: '/guides/boise-home-building-guide' },
  ],
};

export const BOISE_CUSTOM_HOME_PLANNING: LandingSection = {
  heading: 'Plan your Boise custom home',
  paragraphs: [
    'A custom home starts with how you want to live and what the Boise parcel can support. Bring your room needs, approximate size, budget priorities and any plans you already have. We review the site and the design together so the floor plan and the line-item budget describe the same project.',
    'Use the planning conversation to separate decisions you can make now from questions that need a survey, site review or engineering. A preliminary range helps you explore the options; it is not a construction bid or a permit decision.',
  ],
  bullets: [
    'Already own the land? Share the address, available survey and utility information, along with any recorded design restrictions.',
    'Still comparing lots? Start with a lot evaluation before committing to a floor plan that may not suit the property.',
    'Already have drawings? Bring the current set and your must-haves so we can review constructability and scope before pricing.',
  ],
  subsections: [
    {
      heading: 'Settle the scope before construction',
      paragraphs: [
        'The written scope should distinguish the home itself from land, site work and other separately budgeted items. Review the allowance amounts and selections together, then keep any later changes priced and approved in writing. Our design-build process keeps design, engineering, permitting and construction with one accountable team.',
        'For parcel jurisdiction and records to gather, use our Boise lot-planning overview. For the wider service scope and planning ranges, see custom home building across the Treasure Valley.',
      ],
    },
  ],
  links: [
    { label: 'Boise lot planning and jurisdiction checks', href: '/areas/boise' },
    { label: 'Home design and plans', href: '/services/home-plans-design' },
    { label: 'Build on land you already own', href: '/services/build-on-your-lot' },
    { label: 'Custom home building across the Treasure Valley', href: '/services/custom-home-builder' },
  ],
};
