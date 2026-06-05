import { buildSectionsHtml, CITIES_LIST, PILLAR_COST, type ContentSection } from './snippets';
import { expandLocation } from '../contentFactory';

const tvSections: ContentSection[] = [
  {
    h2: 'Why the Treasure Valley is a distinct remodeling market',
    paragraphs: [
      `We serve ${CITIES_LIST} across Ada and Canyon Counties with design-build kitchen, bathroom, whole-home, addition, and ADU work.`,
      'Costs, permits, housing stock, and HOA rules vary by city - use this hub to pick your city guide, then the topic guide that matches your project.',
    ],
  },
  {
    h2: 'City and neighborhood guides',
    list: [
      '<a href="/guides/boise-remodeling-guide">Boise</a>',
      '<a href="/guides/meridian-remodeling-guide">Meridian</a>',
      '<a href="/guides/eagle-remodeling-guide">Eagle</a>',
      '<a href="/guides/kuna-remodeling-guide">Kuna</a>',
      '<a href="/guides/nampa-remodeling-guide">Nampa</a>',
      '<a href="/guides/star-remodeling-guide">Star</a>',
      '<a href="/guides/middleton-remodeling-guide">Middleton</a>',
      '<a href="/guides/caldwell-remodeling-guide">Caldwell</a>',
    ],
    paragraphs: ['Each guide links local housing notes, permits, and service URLs.'],
  },
  {
    h2: 'Ada County vs Canyon County',
    paragraphs: [
      'Boise, Meridian, Eagle, Kuna, and Star primarily use Ada County for many residential permits. Nampa, Middleton, and Caldwell are in Canyon County.',
      '<a href="/blog/ada-vs-canyon-county-permit-timelines">Permit timeline comparison</a>',
    ],
  },
  {
    h2: 'Planning ranges by project type',
    table: {
      className: 'cost-table',
      headers: ['Project', 'Planning note'],
      rows: [
        ['Kitchen', 'Layout and cabinets drive budget'],
        ['Bathroom', 'Master vs guest baths differ'],
        ['Whole-home', 'Sequence MEP before finishes'],
        ['Addition', 'Setbacks and soil matter early'],
      ],
    },
    paragraphs: [`Full bands: <a href="${PILLAR_COST}">Boise Remodeling Cost Guide</a>.`],
  },
  {
    h2: 'Hub guides by project',
    list: [
      '<a href="/guides/boise-kitchen-remodeling-guide">Kitchen</a>',
      '<a href="/guides/boise-bathroom-remodeling-guide">Bathroom</a>',
      '<a href="/guides/boise-home-addition-guide">Additions</a>',
      '<a href="/guides/whole-home-remodeling-guide">Whole-home</a>',
      '<a href="/guides/choose-remodeling-contractor-boise">Contractor selection</a>',
      '<a href="/guides/boise-remodeling-process-guide">Process</a>',
      '<a href="/guides/best-remodeling-roi-boise">ROI</a>',
      '<a href="/guides/outdoor-living-remodeling-guide">Outdoor living</a>',
    ],
    paragraphs: [],
  },
  {
    h2: 'Next steps',
    paragraphs: [
      '<a href="/#calculator">Estimator</a> · <a href="/contact">Consultation</a> · <a href="/areas">Service areas</a>.',
    ],
  },
];

const boiseSections: ContentSection[] = [
  {
    h2: 'Boise neighborhoods at a glance',
    paragraphs: [
      'North End bungalows, Bench ranches, Harris Ranch, and East Boise infill each need different structural and electrical strategies.',
      'We coordinate Ada County permits for layout changes, additions, and structural kitchen/bath work.',
    ],
  },
  {
    h2: 'North End and Bench',
    paragraphs: [
      'Smaller footprints and galley kitchens are common - creative storage and panel upgrades matter when walls open.',
      '<a href="/guides/north-end-remodeling-guide">North End guide</a> · <a href="/guides/boise-bench-remodeling-guide">Bench guide</a>.',
    ],
  },
  {
    h2: 'Harris Ranch and East Boise',
    paragraphs: [
      'Open kitchens, mudrooms, and primary suites are frequent. HOAs may review exterior materials.',
      '<a href="/guides/harris-ranch-remodeling-guide">Harris Ranch</a> · <a href="/guides/east-boise-remodeling-guide">East Boise</a>.',
    ],
  },
  {
    h2: 'Costs and services in Boise',
    paragraphs: [
      'Kitchens often plan $45,000–$120,000+; master baths vary with layout and waterproofing.',
      `<a href="${PILLAR_COST}">Cost guide</a> · <a href="/services/kitchen-remodel/boise">Kitchen</a> · <a href="/services/bathroom-remodel/boise">Bath</a> · <a href="/areas/boise">Area page</a>.`,
    ],
  },
  {
    h2: 'Boise planning checklist',
    list: [
      'Confirm Ada County path for layout changes',
      'Hold contingency in pre-1990 homes',
      'Lock appliance rough-in before drywall',
      'Compare bids with identical scope',
    ],
    paragraphs: [],
  },
  {
    h2: 'Next steps in Boise',
    paragraphs: [
      '<a href="/contact">Consultation</a> · <a href="/guides/treasure-valley-remodeling-guide">Treasure Valley hub</a>.',
    ],
  },
];

export const TREASURE_VALLEY_GUIDE_HTML = expandLocation(
  buildSectionsHtml(tvSections),
  'treasure-valley-remodeling-guide',
);
export const BOISE_GUIDE_HTML = expandLocation(buildSectionsHtml(boiseSections), 'boise-remodeling-guide');

export const TV_QUICK_ANSWER =
  'The Treasure Valley covers Boise, Meridian, Eagle, Kuna, Star, Middleton, Nampa, and Caldwell - Ada and Canyon Counties use different permit paths. Pick your city guide, then the topic guide for your project.';

export const BOISE_QUICK_ANSWER =
  'Boise spans North End, Bench, Harris Ranch, and East Boise - each with different layout, electrical, and permit needs. Use neighborhood guides and our cost guide for planning.';

export const TV_TAKEAWAYS = [
  'Ada and Canyon Counties use different permit paths.',
  'Pick a city guide for local context.',
  'Use the cost guide for planning bands.',
];

export const BOISE_TAKEAWAYS = [
  'Neighborhood era drives electrical and layout scope.',
  'North End and Bench need creative kitchen plans.',
  'Link to city services for each project type.',
];
