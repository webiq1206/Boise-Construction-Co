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
      'Septic feasibility confirmed with Central District Health',
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
      ['Septic system', '___________', 'Designer / CDH'],
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
  {
    type: 'title',
    text: 'Ada vs Canyon County New Home Permits',
  },
  {
    type: 'subtitle',
    text: 'Quick reference for Treasure Valley owners building a new home. Timelines are estimates.',
  },
  { type: 'heading', text: 'Which county reviews my build?' },
  {
    type: 'table',
    headers: ['Area', 'County', 'Review'],
    rows: [
      ['Boise, Meridian, Eagle', 'Ada', 'City or Ada County'],
      ['Kuna, Star', 'Ada', 'City or Ada County'],
      ['Nampa, Middleton', 'Canyon', 'City or Canyon County'],
      ['Caldwell', 'Canyon', 'City or Canyon County'],
    ],
  },
  { type: 'heading', text: 'What a new home permit package contains' },
  {
    type: 'bullets',
    items: [
      'Site plan showing setbacks, access, grading, and drainage',
      'Architectural set: floor plans, elevations, sections, details',
      'Structural engineering stamped for our seismic and snow loads',
      'Energy code compliance documentation',
      'Utility will-serve letters, or well and septic approvals',
      'Septic permit through Central District Health on rural parcels',
    ],
  },
  { type: 'heading', text: 'Inspection sequence during construction' },
  {
    type: 'bullets',
    items: [
      'Footing and foundation, before concrete',
      'Underground plumbing, before backfill',
      'Framing, plus rough electrical, plumbing, and mechanical',
      'Insulation and air sealing, before drywall',
      'Final, then the certificate of occupancy',
    ],
  },
  { type: 'heading', text: 'Typical timeline bands' },
  {
    type: 'table',
    headers: ['Phase', 'Ada County', 'Canyon County'],
    rows: [
      ['Design and engineering', '8-16 weeks', '8-16 weeks'],
      ['Plan review', '4-10 weeks', '4-10 weeks'],
      ['Inspections', 'During construction', 'During construction'],
    ],
  },
  { type: 'heading', text: 'Owner checklist' },
  {
    type: 'checkboxes',
    items: [
      'Confirm the jurisdiction before design starts, not after',
      'Ask whether permits and impact fees are inside the contract price',
      'Respond to plan-check comments the week they arrive',
      'Do not let work be covered before its rough inspection',
      'HOA design review runs separately and in parallel',
    ],
  },
  { type: 'heading', text: 'Learn more' },
  {
    type: 'bullets',
    items: [
      `Visual flowchart: ${SITE_CONFIG.siteUrl}/resources/ada-canyon-permit-flow`,
      `Article: ${SITE_CONFIG.siteUrl}/blog/ada-vs-canyon-county-permit-timelines`,
      `Process guide: ${SITE_CONFIG.siteUrl}/guides/boise-home-building-process-guide`,
    ],
  },
];

export const PDF_FOOTERS = {
  budget: FOOTER,
  checklist: FOOTER,
  permits: FOOTER,
} as const;
