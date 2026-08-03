/**
 * Generates the SITE-WIDE default Open Graph card: public/images/og-default.png.
 *
 * This is the fallback share image for every page that has no post-specific card
 * (home, services, areas, about, contact). app/layout.tsx and lib/page-metadata
 * both point social scrapers and iMessage at it.
 *
 * WHY THIS SCRIPT EXISTS. The previous og-default.png was a hand-made asset with
 * no reproduction path, so the rebrand missed it: every share of the site kept
 * surfacing "BOISE REMODELING Co · CUSTOM REMODELING" months after the company
 * became a home builder. Nothing regenerated it because nothing could. Now it
 * has a generator, keyed off the same brand tokens and fonts as the per-post
 * cards in generate-og-images.mjs, so it can never silently drift again.
 *
 * Usage:  node scripts/generate-og-default.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assets = path.join(__dirname, 'og-assets');

const W = 1200;
const H = 630;

// Brand tokens, identical to generate-og-images.mjs.
const BONE = '#F7F5F3';
const MIST = '#9F9C97';
const OCHRE = '#D09A5C';
const CHARCOAL = '#201E1D';

// Company name and its own domain, now that the site runs at boiseconstruction.co.
//
// Set entirely in Montserrat, matching the per-post cards in
// generate-og-images.mjs. The on-page wordmark italicises "Co." in Fraunces, but
// Fraunces is a variable font that satori's font parser cannot read (it throws
// on the character map), so the OG toolchain has only ever used Montserrat. A
// consistent, correct wordmark beats a broken build for a matching italic.
const COMPANY = 'BOISE CONSTRUCTION CO';
const SUBTITLE = 'CUSTOM HOME BUILDER';
const LOCALE = 'TREASURE VALLEY · IDAHO';
const DOMAIN = 'BOISECONSTRUCTION.CO';

const fontLight = fs.readFileSync(path.join(assets, 'Montserrat-Light.ttf'));
const fontMedium = fs.readFileSync(path.join(assets, 'Montserrat-Medium.ttf'));

function h(type, style, children) {
  return { type, props: { style, ...(children !== undefined ? { children } : {}) } };
}

/** One L-shaped corner bracket, mirrored via flags. */
function corner(top, left) {
  const len = 46;
  const thick = 2;
  const inset = 48;
  const vert = { position: 'absolute', width: thick, height: len, backgroundColor: OCHRE, display: 'flex' };
  const horiz = { position: 'absolute', width: len, height: thick, backgroundColor: OCHRE, display: 'flex' };
  const y = top ? { top: inset } : { bottom: inset };
  const x = left ? { left: inset } : { right: inset };
  return h('div', { position: 'absolute', width: len, height: len, ...y, ...x, display: 'flex' }, [
    h('div', { ...vert, ...(top ? { top: 0 } : { bottom: 0 }), ...(left ? { left: 0 } : { right: 0 }) }),
    h('div', { ...horiz, ...(top ? { top: 0 } : { bottom: 0 }), ...(left ? { left: 0 } : { right: 0 }) }),
  ]);
}

function rule(mt, mb) {
  return h('div', { width: 64, height: 2, backgroundColor: OCHRE, marginTop: mt, marginBottom: mb, display: 'flex' });
}

async function build() {
  const tree = h('div', {
    width: W, height: H, position: 'relative', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat',
    // Radial highlight over charcoal, matching the original card's soft centre glow.
    backgroundColor: CHARCOAL,
    backgroundImage: 'radial-gradient(circle at 50% 42%, #2B2825 0%, #201E1D 60%)',
  }, [
    corner(true, true), corner(true, false), corner(false, true), corner(false, false),
    h('div', {
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 900,
    }, [
      // Wordmark, Montserrat Light, letterspaced. Sized to sit on one line at
      // 1200px wide; "BOISE CONSTRUCTION CO" is longer than the old wordmark, so
      // this runs a little smaller than a two-word name would.
      h('div', {
        display: 'flex', textAlign: 'center', fontSize: 47, fontWeight: 300, color: BONE,
        letterSpacing: '5px', whiteSpace: 'nowrap',
      }, COMPANY),
      rule(28, 20),
      h('div', {
        display: 'flex', fontSize: 22, fontWeight: 500, color: MIST, letterSpacing: '5px',
      }, SUBTITLE),
      h('div', {
        display: 'flex', fontSize: 15, fontWeight: 500, color: MIST, letterSpacing: '3px', marginTop: 12,
      }, LOCALE),
      rule(40, 40),
      h('div', {
        display: 'flex', fontSize: 20, fontWeight: 500, color: OCHRE, letterSpacing: '4px',
      }, DOMAIN),
    ]),
  ]);

  const svg = await satori(tree, {
    width: W, height: H,
    fonts: [
      { name: 'Montserrat', data: fontLight, weight: 300, style: 'normal' },
      { name: 'Montserrat', data: fontMedium, weight: 500, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  const dest = path.join(root, 'public', 'images', 'og-default.png');
  // Kept as PNG (its existing format and filename, referenced across the app).
  await sharp(png).png().toFile(dest);
  return dest;
}

build()
  .then((dest) => console.log(`og-default written: ${dest} (${Math.round(fs.statSync(dest).size / 1024)}KB)`))
  .catch((e) => { console.error('ERR', e.message); process.exit(1); });
