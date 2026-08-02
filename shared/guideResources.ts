/** Downloadable PDFs and visual resources linked from guides and blog posts. */

export type GuideResourceKind = 'pdf' | 'visual';

export interface GuideResource {
  id: string;
  title: string;
  description: string;
  kind: GuideResourceKind;
  /** Public path for PDF, or site path for visual page */
  href: string;
  fileLabel?: string;
}

/**
 * Filenames keep their original paths where the subject survived the
 * repositioning, so existing inbound links and any copy already saved to
 * someone's downloads folder keep resolving. The permit guide is unchanged in
 * subject; the budget worksheet and the old kitchen-and-bath checklist are
 * rebuilt for new construction, and the checklist becomes a lot-evaluation
 * checklist, which is the equivalent "bring this to the first meeting" document
 * for someone building rather than renovating.
 */
export const GUIDE_RESOURCES: Record<string, GuideResource> = {
  'budget-worksheet': {
    id: 'budget-worksheet',
    title: 'New Home Budget Worksheet',
    description:
      'Printable worksheet with 2026 Treasure Valley build cost bands, budget buckets from land through landscaping, and bid comparison checks.',
    kind: 'pdf',
    href: '/downloads/new-home-budget-worksheet.pdf',
    fileLabel: 'PDF · 2 pages',
  },
  'lot-checklist': {
    id: 'lot-checklist',
    title: 'Lot Evaluation Checklist',
    description:
      'What to verify before you buy a parcel: access, utilities, septic feasibility, soils, slope, and setbacks. Bring it to a showing.',
    kind: 'pdf',
    href: '/downloads/lot-evaluation-checklist.pdf',
    fileLabel: 'PDF · 2 pages',
  },
  'ada-canyon-permit-pdf': {
    id: 'ada-canyon-permit-pdf',
    title: 'Ada vs Canyon Permit Guide',
    description:
      'One-page reference: which county reviews your build, what a new-home permit package contains, and the inspection sequence.',
    kind: 'pdf',
    href: '/downloads/ada-canyon-permit-guide.pdf',
    fileLabel: 'PDF · 1 page',
  },
  'ada-canyon-permit-flow': {
    id: 'ada-canyon-permit-flow',
    title: 'Permit Flow Infographic',
    description: 'Visual walkthrough of Ada vs Canyon County paths and inspection milestones.',
    kind: 'visual',
    href: '/resources/ada-canyon-permit-flow',
    fileLabel: 'Interactive page',
  },
};

/** Resource IDs shown on each guide slug */
export const RESOURCES_BY_GUIDE_SLUG: Record<string, string[]> = {
  'boise-home-building-cost-guide': ['budget-worksheet', 'lot-checklist'],
  'boise-home-building-process-guide': [
    'ada-canyon-permit-pdf',
    'ada-canyon-permit-flow',
    'budget-worksheet',
  ],
  'buying-land-to-build-boise': ['lot-checklist', 'ada-canyon-permit-pdf'],
  'treasure-valley-home-building-guide': [
    'budget-worksheet',
    'ada-canyon-permit-pdf',
    'ada-canyon-permit-flow',
  ],
  'custom-home-design-guide': ['budget-worksheet'],
  'choose-home-builder-boise': ['budget-worksheet'],
  'boise-home-building-guide': ['budget-worksheet', 'lot-checklist'],
};

export const RESOURCES_BY_BLOG_SLUG: Record<string, string[]> = {
  'ada-vs-canyon-county-permit-timelines': [
    'ada-canyon-permit-pdf',
    'ada-canyon-permit-flow',
  ],
  'boise-building-permit-guide': ['ada-canyon-permit-pdf', 'ada-canyon-permit-flow'],
  'how-to-budget-a-new-home-boise': ['budget-worksheet'],
  'cost-to-build-a-house-boise': ['budget-worksheet'],
  'lot-evaluation-checklist': ['lot-checklist'],
  'how-to-buy-a-buildable-lot-boise': ['lot-checklist'],
  'well-and-septic-cost-idaho': ['lot-checklist'],
  'how-to-compare-builder-bids': ['budget-worksheet'],
};

export function getResourcesForGuide(slug: string): GuideResource[] {
  const ids = RESOURCES_BY_GUIDE_SLUG[slug] ?? [];
  return ids.map((id) => GUIDE_RESOURCES[id]).filter(Boolean);
}

export function getResourcesForBlog(slug: string): GuideResource[] {
  const ids = RESOURCES_BY_BLOG_SLUG[slug] ?? [];
  return ids.map((id) => GUIDE_RESOURCES[id]).filter(Boolean);
}

export const ALL_RESOURCES_LIST = Object.values(GUIDE_RESOURCES);
