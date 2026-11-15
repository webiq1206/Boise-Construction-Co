/**
 * Synthetic Boise Construction Co estimator emails for tests and screenshots.
 * Amounts are stored on the fixture. Nothing is priced again and nothing is sent.
 */
import {ESTIMATOR_BRAND} from '../lib/p5/brand.ts';
import {issueRecord} from '../lib/p5/estimateDocument.ts';
import {estimateEmail} from '../lib/p5/estimateEmail.ts';
import {emailBrandFrom, layout, renderEmail, valueTier, type ValueTier} from '../lib/p5/emailKit.ts';
import {renderIntakeEmail, type IntakeEmailFile} from '../lib/p5/intakeEmail.ts';
import {emptyIntakeDetails, type IntakeSnapshot} from '../lib/p5/intakeContract.ts';
import {routeIntake} from '../lib/p5/intakePolicy.ts';

export const EMAIL_FROM = 'P5 Home Co <hello@p5homeco.com>';
const ID = '0f1e2d3c-4b5a-4000-8000-00000000abcd';

export type ConstructionFixture = {
  id: string;
  service: 'change-order' | 'addition' | 'new-construction' | 'adu';
  tier: ValueTier | 'withheld';
  range: {low: number; high: number} | null;
  name: string;
  email: string;
  phone: string;
  summary: string;
  uploads: {name: string; url?: string}[];
  /** Internal build-up only. It must not appear on the customer email. */
  directCost: number | null;
};

export const CONSTRUCTION_FIXTURES: ConstructionFixture[] = [
  {
    id: 'construction-change-small',
    service: 'change-order',
    tier: 'small',
    range: {low: 4200, high: 6800},
    name: '[QA] Ada Small',
    email: 'ada.small@example.com',
    phone: '(208) 555-0101',
    summary: 'A short list of finish changes before we close up the new home.',
    uploads: [],
    directCost: 2500,
  },
  {
    id: 'construction-addition-mid',
    service: 'addition',
    tier: 'standard',
    range: {low: 28400, high: 46900},
    name: '[QA] Bea Addition',
    email: 'bea.addition@example.com',
    phone: '',
    summary: 'A single story addition with a bedroom and a bath.',
    uploads: [],
    directCost: 19000,
  },
  {
    id: 'construction-home-major',
    service: 'new-construction',
    tier: 'major',
    range: {low: 486000, high: 612000},
    name: '[QA] Cam Home',
    email: 'cam.home@example.com',
    phone: '(208) 555-0103',
    summary: 'A custom home on our lot in the Treasure Valley.',
    uploads: [],
    directCost: 310000,
  },
  {
    id: 'construction-adu-uploads',
    service: 'adu',
    tier: 'standard',
    range: {low: 52000, high: 74000},
    name: '[QA] Dee Plans',
    email: 'dee.plans@example.com',
    phone: '(208) 555-0104',
    summary: 'An accessory dwelling beside the house. Plans are attached.',
    uploads: [
      {name: 'adu-plan.pdf', url: 'https://boiseconstruction.co/admin/p5-estimators'},
      {name: 'photo.jpg', url: 'https://boiseconstruction.co/admin/p5-estimators'},
    ],
    directCost: 41000,
  },
  {
    id: 'construction-home-withheld',
    service: 'new-construction',
    tier: 'withheld',
    range: null,
    name: '[QA] <script> Home',
    email: 'script.home@example.com',
    phone: '(208) 555-0105',
    summary: 'A custom home. The scope is not ready for a number.',
    uploads: [],
    directCost: null,
  },
];

function recordFor(fixture: ConstructionFixture) {
  const contact = {name: fixture.name, email: fixture.email, phone: fixture.phone};
  const scope = {
    text: fixture.summary,
    answers: {service: fixture.service, finish: 'mid-range', location: 'Meridian, ID', address: '100 Example Ave, Boise, ID 83702'},
    uploads: fixture.uploads,
    uncertainFields: [] as string[],
  };
  const issue = issueRecord({brandId: ESTIMATOR_BRAND.id, id: ID, revision: 1, now: new Date('2026-11-15T16:44:00Z'), contact, scope});
  const customer = {
    summary: fixture.summary,
    includedCategories: ['General'],
    range: fixture.range,
    categoryRanges: fixture.range ? [{category: 'General', low: fixture.range.low, high: fixture.range.high}] : [],
    lineItems: [],
    assumptions: [],
    exclusions: ['Land'],
    allowances: [],
    factors: [],
    message: 'Review your estimate.',
    nextStep: 'Consultation',
    disclaimer: 'Preliminary only.',
    issue,
  };
  const internal = fixture.directCost == null ? {service: fixture.service} : {service: fixture.service, directCost: fixture.directCost, publishable: false, warnings: []};
  return {contact, customer, internal, scope};
}

export function renderConstructionFixture(fixture: ConstructionFixture) {
  const record = recordFor(fixture);
  return {
    fixture,
    tier: fixture.range ? valueTier(fixture.range.high) : 'withheld' as const,
    admin: estimateEmail(ID, record, true),
    customer: estimateEmail(ID, record, false),
  };
}

export function renderConstructionIntake(files: IntakeEmailFile[] = []) {
  const snapshot = {
    schema: 1,
    projectId: 'construction:12345678-1234-4234-8234-123456789abc',
    draftId: '12345678-1234-4234-8234-123456789abc',
    originSite: 'construction',
    currentSite: 'construction',
    revision: 1,
    contextVersion: 0,
    savedAt: '2026-11-15T16:44:00Z',
    contact: {name: '[QA] Ada Small', email: 'ada.small@example.com', phone: '2085550101', preferredContact: 'email'},
    details: emptyIntakeDetails(),
    scope: {text: 'A custom home on our lot.', answers: {service: 'new-construction'}, extraction: null, uploads: []},
    routing: routeIntake('construction', 'new-construction'),
    unresolved: [],
  } as IntakeSnapshot;
  return {customer: renderIntakeEmail(snapshot, false, files), admin: renderIntakeEmail(snapshot, true, files)};
}

export function renderConstructionReview() {
  const brand = emailBrandFrom(ESTIMATOR_BRAND);
  const text = [
    `${ESTIMATOR_BRAND.name}: customer requested a project review.`,
    'Reference: P5-0F1E2D3C',
    'Name: [QA] Ada Small',
    'Email: ada.small@example.com',
    'Phone: (208) 555-0101',
    '',
    'Saved project description:',
    'A custom home on our lot in the Treasure Valley.',
    '',
    'Review the saved project in the estimator administration area. This request is not a completed price or contract.',
  ].join('\n');
  const html = layout({
    brand,
    preheader: 'Project review requested: P5-0F1E2D3C',
    title: 'Project review requested',
    kicker: 'P5-0F1E2D3C',
    body: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${ESTIMATOR_BRAND.ink};white-space:pre-wrap;">${text.replace(/[&<>]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c] as string))}</p>`,
  });
  return {html, text, subject: 'Project review requested: P5-0F1E2D3C'};
}

/** Same blocks as the shared outbox delivery alert. */
export function renderConstructionAlert() {
  const mail = emailBrandFrom(ESTIMATOR_BRAND);
  return renderEmail({
    brand: mail,
    preheader: 'Estimate 0f1e2d3c-4b5a-4000-8000-00000000abcd needs delivery review.',
    title: 'Estimate delivery needs attention',
    kicker: '0f1e2d3c',
    blocks: [
      {type: 'notice', kind: 'review', text: 'Do not resubmit the lead to retry delivery.'},
      {type: 'section', title: 'Delivery', rows: [{label: 'Reference', value: '0f1e2d3c-4b5a-4000-8000-00000000abcd'}, {label: 'Reason', value: 'ETIMEDOUT'}]},
      {type: 'buttons', items: [{label: 'Open the estimator admin', href: `${mail.siteUrl}/admin/p5-estimators`, variant: 'primary'}]},
    ],
    footerNote: 'Internal delivery alert.',
  });
}
