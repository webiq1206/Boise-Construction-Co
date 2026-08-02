/**
 * Generates a branded OG share card for every current blog post and guide, then
 * rewrites shared/blogOgImages.ts from what was actually produced.
 *
 * The registry used to be hand-maintained, which is how it ended up mapping 60
 * retired remodeling slugs to files that no longer exist while the 52 live posts
 * had no cards at all. Every current post silently fell back to its hero image,
 * so shares went out unbranded. Deriving the registry from the generated files
 * means a slug can only be listed if its card exists on disk.
 *
 * Run: npm run images:og
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const { generateOgCard } = await import('./generate-og-images.mjs');
const { BLOG_POSTS } = await import('../shared/blogContent.ts');
const { GUIDE_PAGES } = await import('../shared/guideContent.ts');
const { getBlogHeroImage } = await import('../shared/blogImages.ts');

/** Resolve a public URL path to a file on disk, preferring the webp original. */
function sourceFor(slug) {
  const url = getBlogHeroImage(slug);
  if (!url) return null;
  const candidates = [
    path.join(root, 'public', url.replace(/^\//, '')),
    path.join(root, 'public', url.replace(/^\//, '').replace(/\.webp$/, '.png')),
    path.join(root, 'public', url.replace(/^\//, '').replace(/\.png$/, '.webp')),
  ];
  return candidates.find((c) => fs.existsSync(c)) ?? null;
}

const targets = [
  ...BLOG_POSTS.map((p) => ({ slug: p.slug, title: p.title, kind: 'post' })),
  ...GUIDE_PAGES.map((g) => ({ slug: g.slug, title: g.title, kind: 'guide' })),
];

const produced = [];
const skipped = [];
let done = 0;

for (const t of targets) {
  const src = sourceFor(t.slug);
  if (!src) {
    skipped.push(`${t.slug} (no hero image resolved)`);
    continue;
  }
  try {
    await generateOgCard(t.slug, t.title, src);
    produced.push(t);
    done += 1;
    if (done % 10 === 0) console.log(`  ...${done}/${targets.length}`);
  } catch (e) {
    skipped.push(`${t.slug} (${e.message})`);
  }
}

const posts = produced.filter((p) => p.kind === 'post');
const guides = produced.filter((p) => p.kind === 'guide');

const body = [
  '/**',
  ' * Branded Open Graph share cards per blog post and guide.',
  ' *',
  ' * GENERATED FILE - do not edit by hand.',
  ' * Run `npm run images:og` to regenerate from the content layer.',
  ' *',
  ' * Each card is the post hero photo under a dark overlay with the title and the',
  ' * brand eyebrow, 1200x630 JPEG at public/images/blog/{slug}-og.jpg. Blog and',
  ' * guide metadata fall back to the plain hero image when a slug is absent here.',
  ' */',
  'export const BLOG_OG_IMAGES: Record<string, string> = {',
  '  // Blog posts',
  ...posts.map((p) => `  '${p.slug}': '/images/blog/${p.slug}-og.jpg',`),
  '  // Guides',
  ...guides.map((g) => `  '${g.slug}': '/images/blog/${g.slug}-og.jpg',`),
  '};',
  '',
  'export function getBlogOgImage(slug: string): string | undefined {',
  '  return BLOG_OG_IMAGES[slug];',
  '}',
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'shared', 'blogOgImages.ts'), body, 'utf8');

console.log(`\nWrote ${produced.length} OG cards (${posts.length} posts, ${guides.length} guides).`);
console.log('Rewrote shared/blogOgImages.ts');
if (skipped.length) {
  console.log(`\nSkipped ${skipped.length}:`);
  skipped.forEach((s) => console.log(`  - ${s}`));
}
