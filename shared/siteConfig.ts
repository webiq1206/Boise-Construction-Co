/**
 * Central site configuration - NAP, URLs, and contact strings.
 * Override via env for staging; replace placeholder values before launch.
 */

const DEFAULT_PHONE = "(208) 477-1169";
const DEFAULT_PHONE_TEL = "2084771169";
const DEFAULT_EMAIL = "hello@boiseconstruction.co";
// This site now lives on its own domain. boiseremodeling.co was duplicated and
// rebuilt as Boise Construction Co, which runs at boiseconstruction.co;
// boiseremodeling.co remains the separate remodeling business. Every canonical,
// sitemap entry, OG URL, schema @id, and absolute link is built from this value.
const DEFAULT_SITE_URL = "https://boiseconstruction.co";

export const SITE_CONFIG = {
  name: "Boise Construction Co",
  /**
   * The registered legal entity. This brand is an Idaho assumed business name
   * (DBA) of P5 Home Co LLC - there is no separate "Boise Construction Co LLC" company.
   * `name` above stays the DBA, which is what customers know and what belongs
   * in a GBP business-name field; `legalName` is the entity that actually
   * signs contracts, holds the registration and gets verified against state
   * records, so the two are deliberately different values.
   */
  legalName: "P5 Home Co LLC",
  phone: process.env.NEXT_PUBLIC_PHONE ?? DEFAULT_PHONE,
  phoneTel: process.env.NEXT_PUBLIC_PHONE_TEL ?? DEFAULT_PHONE_TEL,
  phoneHref: `tel:${process.env.NEXT_PUBLIC_PHONE_TEL ?? DEFAULT_PHONE_TEL}`,
  phoneSmsHref: `sms:${process.env.NEXT_PUBLIC_PHONE_TEL ?? DEFAULT_PHONE_TEL}`,
  email: process.env.NEXT_PUBLIC_EMAIL ?? DEFAULT_EMAIL,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  /**
   * Public representative named by the P5 brand brief (section 4.2) and
   * docs/growth/OPERATIONS.md. Not a storefront staff listing.
   */
  publicRepresentative: "Nick Perkins",
  // Canonical NAP. Street, city, region, and postal code match the authorized
  // public address. This is a service-area business, not a staffed storefront.
  address: {
    street: "4031 W Wapoot St",
    city: "Meridian",
    state: "ID",
    postalCode: "83646",
    cityState: "Meridian, ID",
    serviceArea: "Treasure Valley · Ada and Canyon County",
  },
  } as const;

/** Shared footer and contact line. Same wording on every P5 brand. */
export const PUBLIC_NAP_LINE =
  `Public representative: ${SITE_CONFIG.publicRepresentative} · ${SITE_CONFIG.address.street}, ${SITE_CONFIG.address.city}, ${SITE_CONFIG.address.state} ${SITE_CONFIG.address.postalCode} · Service-area business, not a staffed storefront.`;

export function formatPhoneDisplay(tel: string = SITE_CONFIG.phoneTel): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return SITE_CONFIG.phone;
}
