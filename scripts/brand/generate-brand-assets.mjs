/**
 * Generates the Boise Construction Co brand marks.
 *
 * The original Boise Remodeling Co marks were typeset and converted to
 * outlines, so the wordmark text is not editable. This script rebuilds the
 * same marks from the source fonts using the geometry recovered from the
 * originals (Montserrat Light at cap-height-derived sizes with 13/112 em
 * tracking, Fraunces italic for the script elements), so the new marks keep
 * the established proportions, colours, and layout.
 *
 * Usage:
 *   node scripts/brand/generate-brand-assets.mjs          # write assets
 *   node scripts/brand/generate-brand-assets.mjs --preview # also write previews
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const assets = path.join(root, "scripts", "og-assets");
const brandDir = path.join(root, "public", "brand");

const BRAND = {
  name: "Boise Construction Co",
  tagline: "CUSTOM HOME BUILDER",
  region: "TREASURE VALLEY \u00b7 IDAHO",
  established: "EST 2020",
  slug: "boise-construction-co",
};

const COLOR = {
  ink: "#2C302F",
  bone: "#F7F5F3",
  rule: "#C9C4BC",
  sage: "#5D6561",
  sageLight: "#9AA098",
  sealRing: "#565B58",
};

const loadFont = (file) =>
  opentype.parse(fs.readFileSync(path.join(assets, file)).buffer);

const montserrat = loadFont("Montserrat-Light.ttf");

// Fraunces ships as a variable font whose default master is Black at the
// smallest optical size, with the "wonky" swash alternates switched on. The
// identity uses the light, high-contrast display cut with plain letterforms,
// so pin the axes before any glyph is measured or drawn.
const fraunces = loadFont("Fraunces-Italic.ttf");
fraunces.variation.set({ wght: 300, opsz: 144, SOFT: 0, WONK: 0 });

/** Tracking used throughout the identity, expressed as a fraction of em. */
const TRACK_EM = 13 / 112;

// The italic "Co." suffix is unchanged by the rename, so the original outlines
// are reused rather than re-rendered. See scripts/brand/extract-co-mark.mjs.
const CO_MARK = JSON.parse(fs.readFileSync(path.join(__dirname, "co-mark.json"), "utf8"));

/**
 * Place the italic "Co." lockup at a given cap height and baseline.
 * Returns the SVG group plus the ink extents so callers can lay out around it.
 */
function coMark({ capHeight, x, y, fill }) {
  const scale = capHeight / CO_MARK.capHeight;
  return {
    svg: `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale.toFixed(6)})"><path d="${CO_MARK.d}" fill="${fill}"/></g>`,
    width: CO_MARK.width * scale,
    maxX: x + CO_MARK.width * scale,
  };
}

const capSize = (font, capHeight) =>
  (capHeight * font.unitsPerEm) / font.tables.os2.sCapHeight;

/**
 * Serialise an opentype Path.
 *
 * opentype's own toPathData() omits the separator before a coordinate that is
 * exactly zero, so "-22.56 0 -22.56" is emitted as "-22.5600-22.56" and the
 * glyph renders corrupt. Any glyph sitting on an exact zero baseline hits this,
 * which is every glyph in the arc-set text, so paths are written out here.
 */
function toPath(p, precision = 3) {
  const n = (v) => {
    const r = Number(v.toFixed(precision));
    return Object.is(r, -0) ? "0" : String(r);
  };
  const out = [];
  for (const c of p.commands) {
    switch (c.type) {
      case "M":
        out.push(`M ${n(c.x)} ${n(c.y)}`);
        break;
      case "L":
        out.push(`L ${n(c.x)} ${n(c.y)}`);
        break;
      case "C":
        out.push(`C ${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`);
        break;
      case "Q":
        out.push(`Q ${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`);
        break;
      case "Z":
        out.push("Z");
        break;
      default:
        break;
    }
  }
  return out.join(" ");
}

/**
 * Lay out a run of text as outline path data.
 * Returns the combined `d` plus the ink box so callers can centre precisely.
 */
function layout(font, text, { size, trackEm = 0, x = 0, y = 0 }) {
  const tracking = trackEm * size;
  let pen = x;
  const parts = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const ch of text) {
    // font.getPath (rather than glyph.getPath) is what honours variable-font
    // axis settings, so all measurement goes through the placed path.
    if (ch !== " ") {
      const p = font.getPath(ch, pen, y, size);
      if (p.commands.length) {
        parts.push(toPath(p));
        const box = p.getBoundingBox();
        minX = Math.min(minX, box.x1);
        maxX = Math.max(maxX, box.x2);
        minY = Math.min(minY, box.y1);
        maxY = Math.max(maxY, box.y2);
      }
    }
    pen += font.getAdvanceWidth(ch, size) + tracking;
  }

  // Trailing tracking is not part of the mark.
  const advance = pen - tracking - x;
  return { d: parts.join(" "), minX, maxX, minY, maxY, advance, inkWidth: maxX - minX };
}

/** Lay out text along a circular arc, one rotated glyph at a time. */
function layoutArc(font, text, { size, trackEm = 0, cx, cy, radius, centerDeg, flip = false }) {
  const tracking = trackEm * size;

  const widths = [...text].map((ch) => ({
    ch,
    advance: font.getAdvanceWidth(ch, size) + tracking,
  }));
  const total = widths.reduce((sum, g) => sum + g.advance, 0) - tracking;
  const totalDeg = (total / (2 * Math.PI * radius)) * 360;

  const dir = flip ? -1 : 1;
  let angle = centerDeg - (dir * totalDeg) / 2;
  const parts = [];

  for (const { ch, advance } of widths) {
    const stepDeg = (advance / (2 * Math.PI * radius)) * 360;
    const midDeg = angle + (dir * stepDeg) / 2;
    const probe = ch === " " ? null : font.getPath(ch, 0, 0, size);
    if (probe && probe.commands.length) {
      const rad = ((midDeg - 90) * Math.PI) / 180;
      const px = cx + radius * Math.cos(rad);
      const py = cy + radius * Math.sin(rad);
      // Glyph drawn at the origin on its own baseline, then rotated upright
      // relative to the circle centre.
      const box = probe.getBoundingBox();
      const halfInk = (box.x1 + box.x2) / 2;
      const d = toPath(font.getPath(ch, -halfInk, 0, size));
      const rot = flip ? midDeg + 180 : midDeg;
      parts.push(
        `<path d="${d}" fill="${COLOR.bone}" transform="translate(${px.toFixed(2)} ${py.toFixed(
          2,
        )}) rotate(${rot.toFixed(3)})"/>`,
      );
    }
    angle += dir * stepDeg;
  }
  return parts.join("");
}

const svgHeader = (w, h, label, desc) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}"><title>${label}</title><desc>${desc}</desc>`;

/* ------------------------------------------------------------------ *
 * Wordmark - "BOISE CONSTRUCTION Co."
 * ------------------------------------------------------------------ */
function buildWordmark(fill) {
  const CAP_HEIGHT = 78.4;
  const size = capSize(montserrat, CAP_HEIGHT);
  const baseline = 132;
  const startX = 73.4;

  const caps = layout(montserrat, "BOISE CONSTRUCTION", {
    size,
    trackEm: TRACK_EM,
    x: startX,
    y: baseline,
  });

  const co = coMark({
    capHeight: CAP_HEIGHT,
    x: caps.maxX + size * 0.34,
    y: baseline,
    fill,
  });

  const width = Math.round(co.maxX + startX);
  const label = `${BRAND.name} wordmark logo`;
  const desc = `Horizontal wordmark logo for ${BRAND.name} - custom home builder and new residential construction in Boise and the Treasure Valley, Idaho.`;

  return (
    svgHeader(width, 200, label, desc) +
    `<path d="${caps.d}" fill="${fill}"/>` +
    co.svg +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ *
 * Primary logo - wordmark over rule, tagline, and region line
 * ------------------------------------------------------------------ */
function buildPrimaryLogo(fill, ruleColor, taglineColor, regionColor) {
  const CAP_HEIGHT = 72.8;
  const size = capSize(montserrat, CAP_HEIGHT);
  const baseline = 196;
  const startX = 60;

  const caps = layout(montserrat, "BOISE CONSTRUCTION", {
    size,
    trackEm: TRACK_EM,
    x: startX,
    y: baseline,
  });
  const co = coMark({
    capHeight: CAP_HEIGHT,
    x: caps.maxX + size * 0.34,
    y: baseline,
    fill,
  });

  const width = Math.round(co.maxX + startX);
  const center = width / 2;

  // Tagline and region lines, centred under the wordmark.
  const tagSize = capSize(montserrat, 18.54);
  const tagTrack = 0.28;
  const tagProbe = layout(montserrat, BRAND.tagline, { size: tagSize, trackEm: tagTrack, x: 0, y: 0 });
  const tag = layout(montserrat, BRAND.tagline, {
    size: tagSize,
    trackEm: tagTrack,
    x: center - tagProbe.inkWidth / 2 - (tagProbe.minX - 0),
    y: 312,
  });

  const regSize = capSize(montserrat, 13.3);
  const regTrack = 0.24;
  const regProbe = layout(montserrat, BRAND.region, { size: regSize, trackEm: regTrack, x: 0, y: 0 });
  const reg = layout(montserrat, BRAND.region, {
    size: regSize,
    trackEm: regTrack,
    x: center - regProbe.inkWidth / 2 - (regProbe.minX - 0),
    y: 356,
  });

  const ruleHalf = 150;
  const label = `${BRAND.name} logo - custom home builder in Boise, Idaho`;
  const desc = `Primary logo for ${BRAND.name}, custom home builder and new residential construction serving Boise and the Treasure Valley, Idaho. Typeset wordmark with tagline.`;

  return (
    svgHeader(width, 420, label, desc) +
    `<path d="${caps.d}" fill="${fill}"/>` +
    co.svg +
    `<line x1="${center - ruleHalf}" y1="262" x2="${center + ruleHalf}" y2="262" stroke="${ruleColor}" stroke-width="1.4"/>` +
    `<path d="${tag.d}" fill="${taglineColor}"/>` +
    `<path d="${reg.d}" fill="${regionColor}"/>` +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ *
 * Seal - circular maker's mark
 * ------------------------------------------------------------------ */
function buildSeal(background) {
  const S = 1024;
  const cx = S / 2;
  const cy = S / 2;
  const arcRadius = 446;

  const arcSize = capSize(montserrat, 22.4);
  const topArc = layoutArc(montserrat, BRAND.tagline, {
    size: arcSize,
    trackEm: 0.16,
    cx,
    cy,
    radius: arcRadius,
    centerDeg: 0,
  });
  const bottomArc = layoutArc(montserrat, BRAND.established, {
    size: arcSize,
    trackEm: 0.16,
    cx,
    cy,
    radius: arcRadius,
    centerDeg: 180,
    flip: true,
  });

  // "BOISE" centred above the script.
  const boiseSize = capSize(montserrat, 42);
  const boiseTrack = 0.3;
  const boiseProbe = layout(montserrat, "BOISE", { size: boiseSize, trackEm: boiseTrack, x: 0, y: 0 });
  const boise = layout(montserrat, "BOISE", {
    size: boiseSize,
    trackEm: boiseTrack,
    x: cx - boiseProbe.inkWidth / 2 - boiseProbe.minX,
    y: 432,
  });

  // Script word, scaled to fit the seal interior.
  const SCRIPT_MAX_WIDTH = 800;
  let scriptSize = 250;
  let script = layout(fraunces, "Construction", { size: scriptSize, x: 0, y: 0 });
  if (script.inkWidth > SCRIPT_MAX_WIDTH) {
    scriptSize = scriptSize * (SCRIPT_MAX_WIDTH / script.inkWidth);
    script = layout(fraunces, "Construction", { size: scriptSize, x: 0, y: 0 });
  }
  const scriptPlaced = layout(fraunces, "Construction", {
    size: scriptSize,
    x: cx - script.inkWidth / 2 - script.minX,
    y: 580,
  });

  // Small "C O" under the script.
  const coSize = capSize(montserrat, 13.3);
  const coTrack = 0.6;
  const coProbe = layout(montserrat, "CO", { size: coSize, trackEm: coTrack, x: 0, y: 0 });
  const co = layout(montserrat, "CO", {
    size: coSize,
    trackEm: coTrack,
    x: cx - coProbe.inkWidth / 2 - coProbe.minX,
    y: 642,
  });

  const tick = (x1, x2, y) =>
    `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${COLOR.sageLight}" stroke-width="1.3"/>`;
  const dot = (x, y, r = 2.1) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${COLOR.sageLight}"/>`;

  const boiseRuleGap = 26;
  const boiseLeftEnd = boise.minX - boiseRuleGap;
  const boiseRightStart = boise.maxX + boiseRuleGap;
  const coLeftEnd = co.minX - boiseRuleGap;
  const coRightStart = co.maxX + boiseRuleGap;

  const label = `${BRAND.name} seal`;
  const desc = `Circular maker's seal for ${BRAND.name}, custom home builder in Boise and the Treasure Valley, Idaho.`;

  return (
    svgHeader(S, S, label, desc) +
    `<rect width="${S}" height="${S}" fill="${background}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="500" fill="none" stroke="${COLOR.sealRing}" stroke-width="2.3"/>` +
    `<circle cx="${cx}" cy="${cy}" r="487" fill="none" stroke="${COLOR.sealRing}" stroke-width="1.5"/>` +
    topArc +
    bottomArc +
    dot(66, cy, 4) +
    `<line x1="66" y1="499" x2="66" y2="481" stroke="${COLOR.sageLight}" stroke-width="1.3"/>` +
    `<line x1="66" y1="525" x2="66" y2="543" stroke="${COLOR.sageLight}" stroke-width="1.3"/>` +
    dot(958, cy, 4) +
    `<line x1="958" y1="499" x2="958" y2="481" stroke="${COLOR.sageLight}" stroke-width="1.3"/>` +
    `<line x1="958" y1="525" x2="958" y2="543" stroke="${COLOR.sageLight}" stroke-width="1.3"/>` +
    tick(boiseLeftEnd - 78, boiseLeftEnd, 410) +
    tick(boiseRightStart, boiseRightStart + 78, 410) +
    dot(boiseLeftEnd - 78, 410) +
    dot(boiseRightStart + 78, 410) +
    `<path d="${boise.d}" fill="${COLOR.bone}"/>` +
    `<path d="${scriptPlaced.d}" fill="${COLOR.bone}"/>` +
    `<path d="${co.d}" fill="${COLOR.sageLight}"/>` +
    tick(coLeftEnd - 78, coLeftEnd, 634) +
    tick(coRightStart, coRightStart + 78, 634) +
    dot(coLeftEnd - 78, 634) +
    dot(coRightStart + 78, 634) +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ *
 * Emblem - compact monogram for favicons and small surfaces
 * ------------------------------------------------------------------ */
function buildEmblem(background, markColor, hairline) {
  const S = 400;
  const cx = S / 2;
  const MAX_LINE_WIDTH = 290;

  /** Centre a tracked cap line, shrinking it if it would breach the frame. */
  const capLine = (text, capHeight, trackEm, baseline) => {
    let size = capSize(montserrat, capHeight);
    let probe = layout(montserrat, text, { size, trackEm, x: 0, y: 0 });
    if (probe.inkWidth > MAX_LINE_WIDTH) {
      size *= MAX_LINE_WIDTH / probe.inkWidth;
      probe = layout(montserrat, text, { size, trackEm, x: 0, y: 0 });
    }
    return layout(montserrat, text, {
      size,
      trackEm,
      x: cx - probe.inkWidth / 2 - probe.minX,
      y: baseline,
    });
  };

  const line1 = capLine("BOISE", 19.5, 0.34, 100);
  const line2 = capLine("CONSTRUCTION", 19.5, 0.34, 139);

  const CO_CAP = 93.3;
  const co = coMark({
    capHeight: CO_CAP,
    x: cx - (CO_MARK.width * CO_CAP) / CO_MARK.capHeight / 2,
    y: 269,
    fill: markColor,
  });

  const tag = capLine(BRAND.tagline, 7, 0.32, 329);

  const label = `${BRAND.name} emblem logo`;
  const desc = `Stacked emblem logo for ${BRAND.name} - custom home builder and new residential construction, Boise and the Treasure Valley, Idaho.`;

  return (
    svgHeader(S, S, label, desc) +
    `<rect width="${S}" height="${S}" rx="28" fill="${background}"/>` +
    `<rect x="30" y="30" width="340" height="340" rx="14" fill="none" stroke="${hairline}" stroke-width="1.3"/>` +
    `<path d="${line1.d}" fill="${markColor}"/>` +
    `<path d="${line2.d}" fill="${markColor}"/>` +
    co.svg +
    `<line x1="158" y1="304" x2="242" y2="304" stroke="${hairline}" stroke-width="1.2"/>` +
    `<path d="${tag.d}" fill="${markColor}" opacity="0.8"/>` +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */
const write = (rel, contents) => {
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, contents);
  console.log("  wrote", rel.replace(/\\/g, "/"));
};

const files = {
  [`public/brand/logos/${BRAND.slug}-wordmark.svg`]: buildWordmark(COLOR.ink),
  [`public/brand/logos/${BRAND.slug}-wordmark-reverse.svg`]: buildWordmark(COLOR.bone),
  [`public/brand/logos/${BRAND.slug}-logo-primary.svg`]: buildPrimaryLogo(
    COLOR.ink,
    COLOR.rule,
    COLOR.sage,
    COLOR.sageLight,
  ),
  [`public/brand/logos/${BRAND.slug}-logo-primary-reverse.svg`]: buildPrimaryLogo(
    COLOR.bone,
    COLOR.sealRing,
    COLOR.sageLight,
    COLOR.sage,
  ),
  [`public/brand/icons/${BRAND.slug}-seal-dark.svg`]: buildSeal(COLOR.ink),
  [`public/brand/icons/${BRAND.slug}-seal-light.svg`]: buildSeal(COLOR.sage),
  [`public/brand/icons/${BRAND.slug}-emblem-dark.svg`]: buildEmblem(
    COLOR.ink,
    COLOR.bone,
    "rgba(247,245,243,0.30)",
  ),
  [`public/brand/icons/${BRAND.slug}-emblem-light.svg`]: buildEmblem(
    COLOR.bone,
    COLOR.ink,
    "rgba(44,48,47,0.30)",
  ),
};

console.log("Brand marks:");
for (const [rel, contents] of Object.entries(files)) write(rel, contents);

/* Raster ladders ---------------------------------------------------- */
const PNG_SIZES = [16, 32, 48, 64, 128, 180, 256, 512, 1024];

function raster(svg, width) {
  return new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
}

console.log("Raster exports:");
for (const variant of ["dark", "light"]) {
  const sealSvg = files[`public/brand/icons/${BRAND.slug}-seal-${variant}.svg`];
  const emblemSvg = files[`public/brand/icons/${BRAND.slug}-emblem-${variant}.svg`];
  for (const size of PNG_SIZES) {
    if (variant === "dark") {
      write(`public/brand/seal/${BRAND.slug}-seal-dark-${size}.png`, raster(sealSvg, size));
    }
    write(`public/brand/emblem/${BRAND.slug}-emblem-${variant}-${size}.png`, raster(emblemSvg, size));
  }
}

for (const [name, width] of [
  ["wordmark-reverse-1660w", 1660],
  ["wordmark-reverse-3320w", 3320],
  ["wordmark-reverse-4980w", 4980],
]) {
  write(
    `public/brand/logos/${BRAND.slug}-${name}.png`,
    raster(files[`public/brand/logos/${BRAND.slug}-wordmark-reverse.svg`], width),
  );
}
for (const [name, width] of [
  ["logo-primary-reverse-1560w", 1560],
  ["logo-primary-reverse-3120w", 3120],
  ["logo-primary-reverse-4680w", 4680],
]) {
  write(
    `public/brand/logos/${BRAND.slug}-${name}.png`,
    raster(files[`public/brand/logos/${BRAND.slug}-logo-primary-reverse.svg`], width),
  );
}

/**
 * Pack PNG buffers into a multi-resolution .ico.
 *
 * The ICO container accepts embedded PNG payloads directly for any dimension up
 * to 256, so no BMP re-encoding is needed. Layout is a 6-byte ICONDIR followed
 * by one 16-byte ICONDIRENTRY per image, then the payloads. A dimension of 256
 * is encoded as 0 in the single width/height bytes.
 */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = [];
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

/* Favicons and app icons -------------------------------------------- */
const sealDark = files[`public/brand/icons/${BRAND.slug}-seal-dark.svg`];
write("public/favicon.svg", sealDark);
write("public/favicon-16.png", raster(sealDark, 16));
write("public/favicon-32.png", raster(sealDark, 32));
write("public/icons/apple-touch-icon.png", raster(sealDark, 180));
write("public/icons/icon-192.png", raster(sealDark, 192));
write("public/icons/icon-512.png", raster(sealDark, 512));
write(
  "public/favicon.ico",
  buildIco([16, 32, 48].map((size) => ({ size, data: raster(sealDark, size) }))),
);

/* Email logos -------------------------------------------------------- */
write(
  "public/email/bcc-logo.png",
  raster(files[`public/brand/logos/${BRAND.slug}-wordmark-reverse.svg`], 1200),
);
write("public/email/bcc-icon.png", raster(sealDark, 256));

/* Optional previews --------------------------------------------------- */
if (process.argv.includes("--preview")) {
  const previewDir = "scripts/brand/preview";
  console.log("Previews:");
  write(`${previewDir}/new-logo-primary.png`, raster(files[`public/brand/logos/${BRAND.slug}-logo-primary.svg`], 1400));
  write(`${previewDir}/new-wordmark.png`, raster(files[`public/brand/logos/${BRAND.slug}-wordmark.svg`], 1400));
  write(`${previewDir}/new-seal-dark.png`, raster(sealDark, 900));
  write(`${previewDir}/new-emblem-dark.png`, raster(files[`public/brand/icons/${BRAND.slug}-emblem-dark.svg`], 400));
}

console.log("\nDone.");
