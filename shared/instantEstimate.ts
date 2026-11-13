/**
 * The family's central instant estimator, as this site links to it.
 *
 * Owner decision, 13 November 2026: the estimator on the parent company's site
 * is the primary pricing call to action on every family site. It is framed into
 * /instant-estimate (components/estimator/EstimatorFrame.tsx). This site holds
 * no estimator logic, pricing or questions of its own for it.
 *
 * Only the projects below can be priced for this brand. A page whose service is
 * not in SERVICE_INSTANT_ESTIMATE_PROJECT keeps "Request a quote": a visitor is
 * never sent to an estimator that cannot price their project.
 */
import { CTA_PRIMARY, CTA_QUOTE } from './ctaCopy';

/** This site's id in the estimator. */
export const INSTANT_ESTIMATOR_BRAND_ID = 'construction';

export const INSTANT_ESTIMATE_PATH = '/instant-estimate';
/** The quote request form: the path to a person. */
export const QUOTE_REQUEST_PATH = '/estimate';

/** Estimator project ids offered for this brand. */
export const INSTANT_ESTIMATE_PROJECTS = ['custom-home', 'addition', 'garage-shop', 'adu'] as const;
export type InstantEstimateProject = (typeof INSTANT_ESTIMATE_PROJECTS)[number];

/**
 * Service page slug to estimator project. Not listed, on purpose:
 * home-plans-design and lot-evaluation (design and site services, not a build
 * the estimator prices) and shop-homes-barndominiums (a shop home is a house,
 * not the detached garage or shop project).
 */
export const SERVICE_INSTANT_ESTIMATE_PROJECT: Readonly<Record<string, InstantEstimateProject>> = {
  'custom-home-builder': 'custom-home',
  'semi-custom-homes': 'custom-home',
  'build-on-your-lot': 'custom-home',
  'design-build': 'custom-home',
  'energy-efficient-homes': 'custom-home',
  'home-additions': 'addition',
  adu: 'adu',
};

/** The same shape the estimator accepts for a project id. */
const PROJECT_ID = /^[a-z0-9-]{1,40}$/;

export function validEstimatorProject(value: unknown): string | null {
  return typeof value === 'string' && PROJECT_ID.test(value) ? value : null;
}

export function instantEstimateHref(project?: string | null): string {
  const valid = validEstimatorProject(project);
  return valid ? `${INSTANT_ESTIMATE_PATH}?project=${valid}` : INSTANT_ESTIMATE_PATH;
}

export interface PrimaryAction {
  label: string;
  href: string;
  /** True when the action opens the instant estimator. */
  instant: boolean;
}

/** The sitewide primary action: the estimator, with the visitor choosing the project. */
export const INSTANT_ESTIMATE_ACTION: PrimaryAction = { label: CTA_PRIMARY, href: INSTANT_ESTIMATE_PATH, instant: true };

/** The quote request form, for work the estimator does not price. */
export const QUOTE_REQUEST_ACTION: PrimaryAction = { label: CTA_QUOTE, href: QUOTE_REQUEST_PATH, instant: false };

/**
 * The primary action for a service page. A mapped service opens the estimator
 * on its project; an unmapped one keeps the quote request it had before.
 */
export function servicePrimaryAction(serviceSlug: string, quoteHref: string = QUOTE_REQUEST_PATH): PrimaryAction {
  const project = SERVICE_INSTANT_ESTIMATE_PROJECT[serviceSlug];
  return project
    ? { label: CTA_PRIMARY, href: instantEstimateHref(project), instant: true }
    : { ...QUOTE_REQUEST_ACTION, href: quoteHref };
}
