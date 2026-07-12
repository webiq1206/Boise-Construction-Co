/**
 * Validates blog and guide image registry coverage and quality.
 * Run: npm run verify:images
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { BLOG_POSTS } from '../shared/blogContent';
import { GUIDE_PAGES } from '../shared/guideContent';
import {
  BLOG_ASSET_COPY_MAP,
  BLOG_IMAGE_REGISTRY,
  HUB_HERO_IMAGES,
} from '../shared/blogImageRegistry';
import { CONTENT_HUBS } from '../shared/contentHubs';

const root = path.join(__dirname, '..');
// Hard errors would break the live site (missing/invalid image files) and always
// fail the build. Quality issues are SEO/a11y nits (short alt text, a shared hero
// image) that warn-only so they never block a deploy; pass --strict (or
// IMAGES_STRICT=1) to enforce them in a CI content-quality gate.
const STRICT = process.argv.includes('--strict') || process.env.IMAGES_STRICT === '1';
const errors: string[] = [];
const qualityIssues: string[] = [];
const warnings: string[] = [];

function resolvePublicPath(urlPath: string): string {
  return path.join(root, 'public', urlPath.replace(/^\//, ''));
}

/** Resolve the on-disk file used for a blog post's hero (follows copyFrom sources). */
function resolveEffectiveImagePath(slug: string, hero: string): string {
  const copySource = BLOG_ASSET_COPY_MAP[slug];
  if (copySource) {
    return copySource;
  }
  return hero;
}

function fileContentHash(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function isLocalPath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

function isExternal(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

// Coverage: every blog post and guide slug
for (const post of BLOG_POSTS) {
  if (!BLOG_IMAGE_REGISTRY[post.slug]) {
    errors.push(`Missing registry entry for blog post: ${post.slug}`);
  }
}

for (const guide of GUIDE_PAGES) {
  if (!BLOG_IMAGE_REGISTRY[guide.slug]) {
    errors.push(`Missing registry entry for guide: ${guide.slug}`);
  }
}

// Hub heroes
for (const hub of CONTENT_HUBS) {
  if (!HUB_HERO_IMAGES[hub.hubSlug]) {
    errors.push(`Missing hub hero for: ${hub.hubSlug}`);
  }
}

// Registry quality checks
const heroUsage = new Map<string, string>();

for (const [slug, entry] of Object.entries(BLOG_IMAGE_REGISTRY)) {
  if (entry.alt.length < 20) {
    qualityIssues.push(`Alt text too short for ${slug} (${entry.alt.length} chars)`);
  }

  if (isExternal(entry.hero)) {
    errors.push(`External hero URL for ${slug}: ${entry.hero}`);
  }

  if (!isLocalPath(entry.hero)) {
    errors.push(`Invalid hero path for ${slug}: ${entry.hero}`);
  } else {
    const filePath = resolvePublicPath(entry.hero);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing file for ${slug}: ${entry.hero}`);
    }

    const prev = heroUsage.get(entry.hero);
    if (prev) {
      qualityIssues.push(`Duplicate hero path: ${entry.hero} used by ${prev} and ${slug}`);
    } else {
      heroUsage.set(entry.hero, slug);
    }
  }

  if (entry.thumbnail) {
    if (isExternal(entry.thumbnail)) {
      errors.push(`External thumbnail URL for ${slug}`);
    } else if (!fs.existsSync(resolvePublicPath(entry.thumbnail))) {
      errors.push(`Missing thumbnail file for ${slug}: ${entry.thumbnail}`);
    }
  }

  // Heuristic relevance: topicTags should relate to hub or slug
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const guide = GUIDE_PAGES.find((g) => g.slug === slug);
  const hubSlug = post?.hubSlug ?? guide?.hubSlug;
  if (hubSlug && entry.topicTags.length > 0) {
    const hubKeyword = hubSlug.replace(/-/g, ' ').split(' ')[0];
    const tagMatch = entry.topicTags.some(
      (t) =>
        hubSlug.includes(t) ||
        t.includes(hubKeyword) ||
        (post?.tags ?? guide?.tags ?? []).some((pt) => pt.includes(t) || t.includes(pt)),
    );
    if (!tagMatch && !entry.topicTags.includes('guide')) {
      warnings.push(`Topic tags may not match hub for ${slug}: [${entry.topicTags.join(', ')}]`);
    }
  }
}

// Visual uniqueness: no two blog posts may share the same image file content
const blogContentHashUsage = new Map<string, string>();

for (const post of BLOG_POSTS) {
  const entry = BLOG_IMAGE_REGISTRY[post.slug];
  if (!entry) continue;

  const effectivePath = resolveEffectiveImagePath(post.slug, entry.hero);
  const filePath = resolvePublicPath(effectivePath);

  if (!fs.existsSync(filePath)) {
    errors.push(
      `Missing effective image for blog post ${post.slug}: ${effectivePath}`,
    );
    continue;
  }

  const hash = fileContentHash(filePath);
  const prev = blogContentHashUsage.get(hash);
  if (prev) {
    qualityIssues.push(
      `Duplicate image content for blog posts ${prev} and ${post.slug} (${effectivePath})`,
    );
  } else {
    blogContentHashUsage.set(hash, post.slug);
  }
}

// Hub hero file checks
for (const [hubSlug, hero] of Object.entries(HUB_HERO_IMAGES)) {
  if (isExternal(hero)) {
    errors.push(`External hub hero for ${hubSlug}`);
  } else if (!fs.existsSync(resolvePublicPath(hero))) {
    errors.push(`Missing hub hero file for ${hubSlug}: ${hero}`);
  }
}

console.log(`Blog image registry: ${Object.keys(BLOG_IMAGE_REGISTRY).length} entries`);
console.log(`Blog posts: ${BLOG_POSTS.length}, Guides: ${GUIDE_PAGES.length}`);

if (warnings.length > 0) {
  console.warn(`\n${warnings.length} warning(s):`);
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

if (qualityIssues.length > 0) {
  console.warn(
    `\n${qualityIssues.length} quality issue(s) (warn-only, build never fails; run with --strict to enforce):`,
  );
  qualityIssues.forEach((q) => console.warn(`  ⚠ ${q}`));
}

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
}

// Hard-fail only on site-breaking errors, or on quality issues under --strict.
if (errors.length > 0 || (STRICT && qualityIssues.length > 0)) {
  process.exit(1);
}

console.log('\nAll blog image checks passed.');
