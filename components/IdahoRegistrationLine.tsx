import {
  DOPL_SEARCH_URL,
  IDAHO_REGISTERED_CONTRACTOR,
} from '@/shared/contractorRegistration';

/** Credential line for JSX only. FAQ, meta, GBP and schema stay plain text. */
export function IdahoRegistrationLine() {
  return (
    <span>
      {IDAHO_REGISTERED_CONTRACTOR}
      {' · '}
      <a
        href={DOPL_SEARCH_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Look up registration 8381215 on Idaho DOPL"
        aria-label="Verify with Idaho DOPL: look up registration 8381215, opens in a new tab"
        className="underline underline-offset-2"
      >
        Verify with Idaho DOPL
      </a>
    </span>
  );
}
