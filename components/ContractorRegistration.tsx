"use client";

import { useLayoutEffect, useRef } from "react";
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
      target="_blank"
      rel="noopener noreferrer"
      title="Look up P5 Home Co LLC, Idaho Registered Contractor #8381215 on Idaho DOPL"
      aria-label="Verify with Idaho DOPL: look up P5 Home Co LLC, Idaho Registered Contractor #8381215, opens in a new tab"
      data-testid="contractor-registration"
    >
      {CONTRACTOR_REGISTRATION_LABEL}
    </a>
  );
}

/** Plain text for /estimate. No outbound link on the funnel. */
export function ContractorRegistrationPlain() {
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const root = document.documentElement;
    const property = "--contractor-registration-height";
    const previous = root.style.getPropertyValue(property);
    const measure = () => root.style.setProperty(property, `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (previous) root.style.setProperty(property, previous);
      else root.style.removeProperty(property);
    };
  }, []);
  return (
    <p ref={ref} className={styles.plain} data-testid="contractor-registration">
      {CONTRACTOR_REGISTRATION_LABEL}
    </p>
  );
}
