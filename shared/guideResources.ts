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

export const GUIDE_RESOURCES: Record<string, GuideResource> = {
  'budget-worksheet': {
    id: 'budget-worksheet',
    title: 'Remodel Budget Worksheet',
    description:
      'Printable worksheet with 2026 Treasure Valley planning ranges, budget buckets, and bid comparison checks.',
    kind: 'pdf',
    href: '/downloads/remodel-budget-worksheet.pdf',
    fileLabel: 'PDF · 2 pages',
  },
  'kitchen-bath-checklist': {
    id: 'kitchen-bath-checklist',
    title: 'Kitchen & Bath Planning Checklist',
    description:
      'Room-by-room checklist for layouts, selections, permits, and construction - bring to your consultation.',
    kind: 'pdf',
    href: '/downloads/kitchen-bath-planning-checklist.pdf',
    fileLabel: 'PDF · 2 pages',
  },
  'ada-canyon-permit-pdf': {
    id: 'ada-canyon-permit-pdf',
    title: 'Ada vs Canyon Permit Guide',
    description: 'One-page reference: jurisdiction map, when permits apply, and timeline bands.',
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
  'boise-remodeling-cost-guide': ['budget-worksheet', 'kitchen-bath-checklist'],
  'boise-remodeling-process-guide': ['kitchen-bath-checklist', 'ada-canyon-permit-pdf', 'ada-canyon-permit-flow'],
  'treasure-valley-remodeling-guide': ['budget-worksheet', 'ada-canyon-permit-pdf', 'ada-canyon-permit-flow'],
  'boise-kitchen-remodeling-guide': ['kitchen-bath-checklist', 'budget-worksheet'],
  'boise-bathroom-remodeling-guide': ['kitchen-bath-checklist'],
  'boise-remodeling-guide': ['budget-worksheet', 'kitchen-bath-checklist'],
};

export const RESOURCES_BY_BLOG_SLUG: Record<string, string[]> = {
  'ada-vs-canyon-county-permit-timelines': [
    'ada-canyon-permit-pdf',
    'ada-canyon-permit-flow',
  ],
  'how-to-budget-remodel-boise': ['budget-worksheet'],
  'kitchen-remodel-cost-boise': ['budget-worksheet', 'kitchen-bath-checklist'],
  'bathroom-remodel-cost-boise': ['kitchen-bath-checklist'],
  'boise-permit-guide': ['ada-canyon-permit-pdf', 'ada-canyon-permit-flow'],
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
