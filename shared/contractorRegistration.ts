/** Published Idaho contractor registration. Rendered on every public page, with no env gate. */
export const CONTRACTOR_REGISTRATION_NUMBER = '8381215';
export const CONTRACTOR_REGISTRATION_LABEL = `Idaho Registered Contractor #${CONTRACTOR_REGISTRATION_NUMBER}`;
export const CONTRACTOR_LICENSE_SEARCH_URL = 'https://edopl.idaho.gov/OnlineServices/?link=PubSearch';

// Compatibility names for the draft About credential line, derived from canonical registration.
export const IDAHO_CONTRACTOR_REGISTRATION_NUMBER = CONTRACTOR_REGISTRATION_NUMBER;
export const IDAHO_REGISTERED_CONTRACTOR = CONTRACTOR_REGISTRATION_LABEL;
export const IDAHO_REGISTERED_CONTRACTOR_PHRASE = `an ${CONTRACTOR_REGISTRATION_LABEL}`;
export const DOPL_SEARCH_URL = CONTRACTOR_LICENSE_SEARCH_URL;
