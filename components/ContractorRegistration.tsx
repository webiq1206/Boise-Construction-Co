import {
  CONTRACTOR_LICENSE_SEARCH_URL,
  CONTRACTOR_REGISTRATION_LABEL,
} from "@/shared/contractorRegistration";
import styles from "./ContractorRegistration.module.css";

/** Linked registration for the marketing footer. */
export function ContractorRegistrationLink() {
  return (
    <a
      href={CONTRACTOR_LICENSE_SEARCH_URL}
      className={`${styles.link} underline underline-offset-2 transition-colors hover:text-inverse-foreground`}
      data-testid="contractor-registration"
    >
      {CONTRACTOR_REGISTRATION_LABEL}
    </a>
  );
}

/** Plain text for /estimate. No outbound link on the funnel. */
export function ContractorRegistrationPlain() {
  return (
    <p className={styles.plain} data-testid="contractor-registration">
      {CONTRACTOR_REGISTRATION_LABEL}
    </p>
  );
}
