import { ArrowUpRight, Phone } from 'lucide-react';
import { familyButtonClass } from '@/components/family/Button';
import { CTA_QUOTE } from '@/shared/ctaCopy';
import { INSTANT_ESTIMATE_PROJECTS, INSTANT_ESTIMATE_PROJECT_LABELS, QUOTE_REQUEST_PATH, instantEstimateHref } from '@/shared/instantEstimate';
import { SITE_CONFIG } from '@/shared/siteConfig';
import planning from './HomePlanningSections.module.css';
import styles from './HomeInstantEstimateProjects.module.css';

/**
 * The homepage block where the planning range explorer used to be (owner,
 * 21 November 2026: one source of prices). PlanningRangeExplorer ran this
 * site's own engine and showed figures that differed from the P5 instant
 * estimator, so it was retired; the component stays in the repository,
 * unmounted. This block shows no figure: it opens the central estimator on
 * each project it prices for this brand, with the path to a person beside it.
 *
 * `#calculator` is kept as a zero-size anchor at the top of the block so old
 * links from outside the site (ads, Google Business Profile posts) still land
 * here. Every link inside the site goes to /instant-estimate.
 */
export function HomeInstantEstimateProjects() {
  return (
    <section
      className={`approved-estimate fr-band ${planning.planningSection} ${styles.section}`}
      id="estimate-by-project"
      aria-labelledby="estimate-by-project-title"
      data-testid="home-instant-estimate-projects"
    >
      <span id="calculator" className={styles.legacyAnchor} aria-hidden="true" />
      <div className="approved-estimate-intro">
        <div>
          <p className="f-eyebrow">INSTANT ESTIMATE</p>
          <h2 id="estimate-by-project-title">Start with your build.<br /><em>See a preliminary range.</em></h2>
        </div>
        <div>
          <p>Pick your project and see a preliminary price range from our instant estimate.</p>
        </div>
      </div>
      <ul className={styles.projects} aria-label="Projects our instant estimate prices">
        {INSTANT_ESTIMATE_PROJECTS.map((id) => (
          <li key={id}>
            <a
              className={familyButtonClass({ variant: 'secondary', size: 'lg', tone: 'dark', block: true, className: styles.project })}
              href={instantEstimateHref(id)}
              data-estimator-project={id}
            >
              <span>{INSTANT_ESTIMATE_PROJECT_LABELS[id]}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <div className={styles.person}>
        <p>Rather talk it through with a person?</p>
        <div className={styles.personActions}>
          <a className={familyButtonClass({ variant: 'tertiary', tone: 'dark' })} href={QUOTE_REQUEST_PATH}>{CTA_QUOTE}</a>
          <a className={familyButtonClass({ variant: 'tertiary', tone: 'dark' })} href={SITE_CONFIG.phoneHref} data-testid="link-phone-estimate-block">
            <Phone size={18} strokeWidth={1.5} aria-hidden="true" />
            Call {SITE_CONFIG.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
