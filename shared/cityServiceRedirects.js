/**
 * Non-ADU /services/{service}/{city} pages that 301 to the parent service.
 * Source: the 21 November 2026 merge list. ADU city pages are not in this list.
 * Each destination is the live service page, so the redirect is one hop.
 */
const ROWS = [
  ['build-on-your-lot', ['boise', 'eagle', 'meridian', 'nampa']],
  ['custom-home-builder', ['boise', 'eagle', 'meridian', 'nampa']],
  ['design-build', ['boise', 'eagle', 'meridian', 'nampa']],
  ['energy-efficient-homes', ['boise', 'meridian']],
  ['home-additions', ['boise', 'meridian']],
  ['home-plans-design', ['boise', 'meridian']],
  ['lot-evaluation', ['boise', 'meridian']],
  ['semi-custom-homes', ['boise', 'eagle', 'meridian', 'nampa']],
  ['shop-homes-barndominiums', ['eagle', 'kuna', 'meridian', 'nampa']],
];

const CITY_SERVICE_MERGES = ROWS.flatMap(([service, cities]) =>
  cities.map((city) => ({
    service,
    city,
    key: `${service}/${city}`,
    source: `/services/${service}/${city}`,
    destination: `/services/${service}`,
  })),
);

const MERGED_KEYS = new Set(CITY_SERVICE_MERGES.map((row) => row.key));

function isMergedCityService(serviceSlug, citySlug) {
  return MERGED_KEYS.has(`${serviceSlug}/${citySlug}`);
}

module.exports = { CITY_SERVICE_MERGES, isMergedCityService };
