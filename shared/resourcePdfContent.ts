import type { PdfBlock } from '@/lib/pdf/drawResourcePdf';
import { SITE_CONFIG } from './siteConfig';

const FOOTER = `${SITE_CONFIG.name} | ${SITE_CONFIG.siteUrl} | Planning resource - not a contract or quote`;

/**
 * Cost figures here must match shared/seoContent.ts and the estimator. A
 * printed PDF outlives the page it came from, so a stale number in here is the
 * one a client will bring to a meeting a year from now.
 */
export const BUDGET_WORKSHEET_BLOCKS: PdfBlock[] = [
  {
    type: 'title',
    text: 'Treasure Valley New Home Budget Worksheet',
  },
  {
    type: 'subtitle',
    text: 'Use with our Boise Home Building Cost Guide. Planning ranges only - firm numbers require a written scope.',
  },
  { type: 'heading', text: '1. Project snapshot' },
  {
    type: 'checkboxes',
    items: [
      'Build site address or parcel number: ______________________',
      'City (Ada / Canyon): _____________________________',
      'Do you own the land yet? Yes / No',
      'Is the lot serviced, or does it need well and septic? _______',
      'Target finished square feet: _____________________',
    ],
  },
  { type: 'heading', text: '2. Vertical construction bands (2026, excludes land)' },
  {
    type: 'table',
    headers: ['Build type', 'Low per sq ft', 'High per sq ft', 'Your target'],
    rows: [
      ['Semi-custom', '$225', '$300', '___________'],
      ['Custom', '$250', '$400', '___________'],
      ['High performance', '$275', '$425', '___________'],
      ['Foothills / high detail', '$450', 'and above', '___________'],
      ['Shop home (blended)', '$150', '$250', '___________'],
    ],
  },
  { type: 'heading', text: '3. Budget buckets (land and site work are separate)' },
  {
    type: 'table',
    headers: ['Category', 'Planned $', 'Notes'],
    rows: [
      ['Land', '___________', 'Not included in per sq ft figures'],
      ['Site work, serviced lot', '___________', 'Commonly $25k to $50k'],
      ['Site work, rural parcel', '___________', 'Commonly $80k to $150k'],
      ['Design and engineering', '___________', '5 to 12 percent of construction'],
      ['Permits and impact fees', '___________', 'Varies by jurisdiction'],
      ['Construction contract', '___________', 'Finished sq ft x rate above'],
      ['Appliances', '___________', 'Client-supplied, not in contract'],
      ['Landscaping beyond front yard', '___________', 'Often excluded'],
      ['Fencing', '___________', 'Often excluded'],
      ['Window coverings', '___________', 'Almost always excluded'],
      ['Contingency', '___________', '5 to 10 percent of construction'],
    ],
  },
  { type: 'heading', text: '4. Compare bids fairly' },
  {
    type: 'checkboxes',
    items: [
      'Same site work carried by every bidder, or excluded by every bidder',
      'Allowances at comparable levels, not just comparable labels',
      'Permits, engineering, and impact fees handled the same way',
      'Same finished square footage and same garage and covered areas',
      'Draw schedule and change order process documented',
      'Exclusions list read in full, not skimmed',
    ],
  },
  { type: 'heading', text: '5. Next steps' },
  {
    type: 'bullets',
    items: [
      `Build cost estimator: ${SITE_CONFIG.siteUrl}/#calculator`,
      `Cost guide: ${SITE_CONFIG.siteUrl}/guides/boise-home-building-cost-guide`,
      `Schedule a consultation: ${SITE_CONFIG.siteUrl}/contact`,
      `Phone: ${SITE_CONFIG.phone}`,
    ],
  },
];

export const LOT_CHECKLIST_BLOCKS: PdfBlock[] = [
  {
    type: 'title',
    text: 'Lot Evaluation Checklist',
  },
  {
    type: 'subtitle',
    text: 'Print this and take it to a showing. A parcel being for sale does not make it buildable.',
  },
  { type: 'heading', text: 'Access and legal' },
  {
    type: 'checkboxes',
    items: [
      'Legal, recorded access to a public road (not a handshake easement)',
      'Easements on the title that cross the buildable area',
      'Zoning permits a single-family dwelling of the size you want',
      'Setbacks, height limit, and lot coverage leave a real building envelope',
      'CCRs or HOA design review requirements obtained in writing',
      'Any plat notes or conditions of approval reviewed',
    ],
  },
  { type: 'heading', text: 'Utilities' },
  {
    type: 'checkboxes',
    items: [
      'Power: at the property line, or how far away and who pays to extend',
      'Water: municipal at the line, or a well is required',
      'Sewer: municipal at the line, or a septic system is required',
      'Septic feasibility: CDH in Ada County; SWDH in Canyon County',
      'Natural gas available, or plan for propane or all-electric',
      'Internet and phone service available at the address',
    ],
  },
  { type: 'heading', text: 'Ground conditions' },
  {
    type: 'checkboxes',
    items: [
      'Slope across the building envelope, and what it does to excavation',
      'Soils: whether a geotechnical report is required',
      'Groundwater depth and seasonal high water table',
      'Fill on site from prior grading or farming',
      'Rock, caliche, or hardpan that changes excavation cost',
      'Drainage: where water goes in a spring melt',
    ],
  },
  { type: 'heading', text: 'Regulatory and environmental' },
  {
    type: 'checkboxes',
    items: [
      'FEMA floodplain designation checked',
      'Irrigation district ditches, laterals, or delivery obligations',
      'Wildland-urban interface requirements if foothills',
      'Wetlands or protected features',
      'Any recorded agricultural or water rights that transfer',
    ],
  },
  { type: 'heading', text: 'Cost to build here' },
  {
    type: 'table',
    headers: ['Item', 'Estimated $', 'Confirmed by'],
    rows: [
      ['Land purchase', '___________', ''],
      ['Well', '___________', 'Driller quote'],
      ['Septic system', '___________', 'Designer / health district'],
      ['Driveway and access', '___________', ''],
      ['Power extension', '___________', 'Utility'],
      ['Excavation and grading', '___________', 'Builder'],
      ['Impact and connection fees', '___________', 'Jurisdiction'],
    ],
  },
  { type: 'heading', text: 'Before you make an offer' },
  {
    type: 'bullets',
    items: [
      'Make the offer contingent on septic feasibility and a soils review',
      'Give yourself enough inspection period to get real quotes, not guesses',
      'A written lot evaluation runs $950 to $3,500 and is credited toward design if you build with us',
      `Lot evaluation: ${SITE_CONFIG.siteUrl}/services/lot-evaluation`,
      `Land guide: ${SITE_CONFIG.siteUrl}/guides/buying-land-to-build-boise`,
    ],
  },
];

export const ADA_CANYON_PERMIT_BLOCKS: PdfBlock[] = [
  { type: 'title', text: 'Treasure Valley Permit Planning' },
  { type: 'subtitle', text: 'Ada and Canyon County reference. Guidance checked October 1, 2026; confirm current requirements for the actual parcel.' },
  { type: 'heading', text: 'Find the right authority' },
  { type: 'bullets', items: [
    'Inside city limits: start with the city building department.',
    'Unincorporated property: start with the county building department.',
    'A mailing address does not establish jurisdiction. Confirm the parcel.',
    'Building, trade, septic, road, utility and HOA reviews can be separate.',
  ] },
  { type: 'heading', text: 'Plan the application and inspections' },
  { type: 'bullets', items: [
    'Ask for the application checklist, required plans and current review queue.',
    'Coordinate site, architectural, structural and energy documents as required.',
    'Confirm fees, outside approvals and who submits each application.',
    'Receive required permits before starting the work they cover.',
    'Schedule rough inspections before covering the work.',
    'Complete final approvals and required occupancy clearance.',
    'Review time depends on scope, completeness, corrections and the current queue.',
  ] },
  { type: 'heading', text: 'Septic systems: use the correct health district' },
  { type: 'bullets', items: [
    'Ada County: Central District Health (CDH).',
    'Canyon County: Southwest District Health (SWDH).',
    'Confirm septic feasibility and approvals before finalizing the site layout.',
  ] },
  { type: 'heading', text: 'Official starting points' },
  { type: 'bullets', items: [
    'City of Boise Building: cityofboise.org (Planning and Development Services)',
    'Ada County: adacounty.id.gov/developmentservices/',
    'Canyon County: canyoncounty.id.gov/building-department/',
    'Central District Health: cdh.idaho.gov (Septic, Subdivisions & Water)',
    'Southwest District Health: swdh.id.gov (Septic & Land Development)',
  ] },
  { type: 'heading', text: 'Keep the project scope together' },
  { type: 'checkboxes', items: [
    'Parcel, proposed work and existing conditions identified',
    'Permit responsibilities, fees and inspections included in the written scope',
    'HOA approval checked separately where applicable',
  ] },
  { type: 'paragraph', text: `Guide and source links: ${SITE_CONFIG.siteUrl}/resources/ada-canyon-permit-flow` },
];

export const PDF_FOOTERS = {
  budget: FOOTER,
  checklist: FOOTER,
  permits: FOOTER,
} as const;

