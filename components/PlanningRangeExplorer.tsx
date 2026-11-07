import { PhoneIcon, TextIcon } from '@/components/family/Icons';
import styles from '@/components/approved/HomePlanningSections.module.css';
import { FAMILY_BRAND } from '@/lib/familyBrand';

/**
 * Homepage quote ask. The planning-range explorer used to show dollar bands
 * here. Call and text use the same numbers and delegated click tracking as the
 * header and footer. The #calculator id stays so existing in-page links still
 * land on this ask.
 */
export function PlanningRangeExplorer() {
  const phone = FAMILY_BRAND.phone;
  return (
    <section
      className={`approved-estimate fr-band ${styles.planningSection}`}
      aria-labelledby="free-quote-title"
      id="calculator"
      data-testid="free-quote-cta"
      data-family-bar-yield
    >
      <div className="approved-estimate-intro">
        <div>
          <h2 id="free-quote-title">Get a free quote</h2>
        </div>
        <div>
          <p>Call or text us about your project and we&apos;ll get back to you with a quote.</p>
        </div>
      </div>
      <div className="fam-contact-actions fam-contact-actions--footer" aria-label="Call or text for a free quote">
        <a
          className="fam-contact-action"
          href={phone.telHref}
          aria-label={`Call ${phone.display}`}
          title={`Call ${phone.display}`}
          data-testid="link-free-quote-call"
        >
          <PhoneIcon />
          <span className="fam-contact-label">Call</span>
        </a>
        <a
          className="fam-contact-action"
          href={phone.smsHref}
          aria-label={`Text ${phone.display}`}
          title={`Text ${phone.display}`}
          data-testid="link-free-quote-text"
        >
          <TextIcon />
          <span className="fam-contact-label">Text</span>
        </a>
      </div>
    </section>
  );
}
