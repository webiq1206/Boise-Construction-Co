/**
 * Every image path referenced by the shared image maps must exist on disk.
 *
 * Nothing else validated these. The blog registry has its own check, but the
 * service, city-service, and area maps were only ever verified by loading the
 * page and noticing the gap, which is how a hero can quietly 404 in production
 * for weeks. A missing hero on a landing page is a conversion problem, not a
 * cosmetic one, so this is a hard failure.
 *
 * Run: npm run verify:image-paths
 */
import fs from 'fs';
import path from 'path';
import { SITE_IMAGES, CONSTRUCTION_IMAGES } from '../shared/siteImages';
import {
  SERVICE_BACKGROUNDS,
  getServiceImageSet,
} from '../shared/serviceBackgrounds';
import {
  CITY_HERO_IMAGES,
  CITY_SERVICE_IMAGES,
  SERVICE_FALLBACK_IMAGES,
  getAreaImageSet,
  getCityServiceImageSet,
} from '../shared/cityServiceImages';
import { CITIES, SERVICES } from '../shared/contentData';
import { BLOG_POSTS } from '../shared/blogContent';
import { GUIDE_PAGES } from '../shared/guideContent';
import { getBlogHeroImage } from '../shared/blogImages';

const root = path.join(__dirname, '..');
const missing: string[] = [];
const seen = new Set<string>();

function check(label: string, urlPath: string | undefined) {
  if (!urlPath) return;
  const key = `${label}|${urlPath}`;
  if (seen.has(key)) return;
  seen.add(key);
  if (!urlPath.startsWith('/')) {
    missing.push(`${label}: not a local path (${urlPath})`);
    return;
  }
  const filePath = path.join(root, 'public', urlPath.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) missing.push(`${label}: ${urlPath}`);
}

for (const [key, value] of Object.entries(SITE_IMAGES)) check(`SITE_IMAGES.${key}`, value);
for (const [key, value] of Object.entries(CONSTRUCTION_IMAGES)) {
  check(`CONSTRUCTION_IMAGES.${key}`, value);
}
for (const [key, value] of Object.entries(SERVICE_BACKGROUNDS)) {
  check(`SERVICE_BACKGROUNDS.${key}`, value);
}
for (const [key, value] of Object.entries(SERVICE_FALLBACK_IMAGES)) {
  check(`SERVICE_FALLBACK_IMAGES.${key}`, value);
}
for (const [key, value] of Object.entries(CITY_HERO_IMAGES)) {
  check(`CITY_HERO_IMAGES.${key}`, value);
}
for (const [key, value] of Object.entries(CITY_SERVICE_IMAGES)) {
  check(`CITY_SERVICE_IMAGES["${key}"]`, value);
}

// Every service page and service-in-city page resolves three slots.
for (const service of SERVICES) {
  const set = getServiceImageSet(service.slug);
  check(`getServiceImageSet(${service.slug}).hero`, set.hero);
  check(`getServiceImageSet(${service.slug}).breather`, set.breather);
  check(`getServiceImageSet(${service.slug}).process`, set.process);

  for (const city of CITIES) {
    const cs = getCityServiceImageSet(service.slug, city.slug);
    check(`getCityServiceImageSet(${service.slug},${city.slug}).hero`, cs.hero);
    check(`getCityServiceImageSet(${service.slug},${city.slug}).breather`, cs.breather);
    check(`getCityServiceImageSet(${service.slug},${city.slug}).process`, cs.process);
  }
}

for (const city of CITIES) {
  const set = getAreaImageSet(city.slug);
  check(`getAreaImageSet(${city.slug}).hero`, set.hero);
  check(`getAreaImageSet(${city.slug}).breather`, set.breather);
  check(`getAreaImageSet(${city.slug}).process`, set.process);
}

// Blog posts and guides resolve their hero through the registry, but a per-item
// `heroImage` override wins over it (see getBlogImageForSlug). Overrides that
// pointed at files which were never created - /images/blog/<slug>.webp and
// /images/guides/<slug>.webp - silently shadowed valid registry images and 404'd
// in production while the alt text (which comes from the registry) still looked
// correct. Validate both the raw override, if any, and the *resolved* hero that
// the page actually requests, for every post and guide.
for (const post of BLOG_POSTS) {
  check(`BLOG_POSTS["${post.slug}"].heroImage`, post.heroImage);
  check(`resolved hero for post "${post.slug}"`, getBlogHeroImage(post.slug, post.heroImage));
}
for (const guide of GUIDE_PAGES) {
  check(`GUIDE_PAGES["${guide.slug}"].heroImage`, guide.heroImage);
  check(`resolved hero for guide "${guide.slug}"`, getBlogHeroImage(guide.slug, guide.heroImage));
}

if (missing.length > 0) {
  console.error(`verify:image-paths FAILED - ${missing.length} missing image(s):`);
  missing.forEach((m) => console.error(`  x ${m}`));
  process.exit(1);
}

console.log(`verify:image-paths OK (${seen.size} image references, all present)`);
