import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBlogImageAlt } from '../shared/blogImages.ts';
import { contentImageAlt } from '../shared/imageAlts.ts';
import { CONSTRUCTION_IMAGES, SITE_IMAGES } from '../shared/siteImages.ts';
import { getServiceImageSet } from '../shared/serviceBackgrounds.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('stock photos keep a representative disclaimer and describe the framing photo', () => {
  const framing = contentImageAlt('/images/framing-in-progress-branded.webp');
  assert.equal(
    framing,
    'Representative image: A worker kneeling beside interior wall framing on a plywood subfloor, with a drill and tape measure nearby',
  );
  assert.equal(
    contentImageAlt('/images/construction/great-room-evening.webp'),
    'Representative image: Living room with a stone fireplace, wood ceiling beams, and large windows at dusk',
  );
  assert.equal(contentImageAlt('/family/p5-p5-construction-branded.webp'), framing);
  const roughIn = 'Representative image: Mechanical rough-in with pipes and wiring inside framed walls';
  assert.equal(contentImageAlt('/images/construction/mechanical-rough-in.webp'), roughIn);
  assert.equal(contentImageAlt('/family/construction-mechanical-rough-in.webp'), roughIn);
  assert.equal(
    contentImageAlt('/images/budget-kitchen-detail.webp'),
    contentImageAlt('/family/construction-budget-kitchen-detail.webp'),
  );
  assert.match(contentImageAlt('/images/construction/rural-site-work.webp'), /well-drilling rig/);
  assert.equal(
    getBlogImageAlt('how-long-does-it-take-to-build-a-house-boise'),
    roughIn,
  );

  for (const file of [
    'components/sections/ValueOverheadSection.tsx',
    'components/sections/WhyChooseUsSection.tsx',
  ]) {
    const source = read(file);
    assert.match(source, /contentImageAlt\(SITE_IMAGES\.valueCraft\)/, file);
    assert.equal(source.includes('alt="Representative image:'), false, file);
  }
  assert.match(read('app/re-10-repairs-boise/page.tsx'), /Representative imagery/);
  assert.equal(read('components/approved/ApprovedHome.tsx').includes('Coordinated framing and mechanical rough-in'), false);

  for (const file of [
    'components/sections/StatementBandSection.tsx',
    'components/sections/ProcessSection.tsx',
    'components/sections/ValueOverheadSection.tsx',
    'components/sections/WhyChooseUsSection.tsx',
    'components/sections/HeroSection.tsx',
    'components/sections/FeaturedBeforeAfterSection.tsx',
    'components/seo/LandingPageTemplate.tsx',
    'app/about/page.tsx',
    'app/contact/page.tsx',
    'components/approved/ApprovedHome.tsx',
  ]) {
    assert.match(read(file), /Representative imagery|Representative image:/, file);
  }

  const about = read('app/about/page.tsx');
  assert.match(about, /concept to completion/);
  assert.match(about, /Representative imagery/);

  const slider = read('components/BeforeAfterSlider.tsx');
  assert.equal(slider.includes('>Before<'), false);
  assert.equal(slider.includes('>After<'), false);
  assert.match(slider, /Compare the two views/);

  const gallery = read('components/sections/ProjectGallerySection.tsx');
  assert.equal(gallery.includes('Our work</p>'), false);
  assert.equal(gallery.includes('Recent homes we have designed'), false);
  assert.equal(read('app/areas/[city]/page.tsx').includes('Recent ${city.name} projects'), false);
  assert.equal(read('components/seo/LandingPageTemplate.tsx').includes('Proof of work'), false);
});

test('Sam replacement photos use the exact alt and a single WebP', () => {
  const exact: Record<string, string> = {
    [SITE_IMAGES.processInProgress]: 'New home framing with roof trusses and a lumber stack near the foothills',
    [CONSTRUCTION_IMAGES.semiCustom]: 'White board-and-batten farmhouse with cedar porch posts, a metal porch roof and an attached garage, foothills behind',
    [CONSTRUCTION_IMAGES.mountainModern]: 'Mountain-modern house with log porch posts and beams, aligned upper and lower windows, and a lit living room',
    [CONSTRUCTION_IMAGES.interior]: 'Great room with timber trusses, a dining table and chairs, and daylight through a gable window',
    [CONSTRUCTION_IMAGES.kitchen]: 'Kitchen with alder cabinets, a stone range wall, a dark granite island and a window facing the hills',
    '/images/construction/bid-review-desk.webp': 'Folders, a highlighter, a tape measure and a hard hat on a desk for reviewing bids',
    '/images/construction/material-choices.webp': 'Oak flooring, tile, lumber, yellow tubing and stone samples on a jobsite table',
  };
  for (const [src, alt] of Object.entries(exact)) {
    assert.equal(contentImageAlt(src), alt, src);
    assert.equal(fs.existsSync(path.join(root, 'public', src.replace(/^\//, ''))), true, src);
    assert.equal(fs.existsSync(path.join(root, 'public', src.replace(/\.webp$/, '-768.webp'))), false, src);
    assert.equal(fs.existsSync(path.join(root, 'public', src.replace(/\.webp$/, '-1280.webp'))), false, src);
  }
  assert.equal(contentImageAlt(SITE_IMAGES.consultBg), '');
  assert.equal(SITE_IMAGES.leadership, SITE_IMAGES.processInProgress);
  assert.equal(getServiceImageSet('custom-home-builder').hero, CONSTRUCTION_IMAGES.mountainModern);
  assert.equal(getServiceImageSet('build-on-your-lot').breather, CONSTRUCTION_IMAGES.mountainModern);
  const served = [
    read('shared/siteImages.ts'),
    read('shared/serviceBackgrounds.ts'),
    read('shared/cityServiceImages.ts'),
    read('shared/blogImageRegistry.ts'),
    read('components/approved/family-content.ts'),
  ].join('\n');
  for (const oldPath of [
    'framing-in-progress-branded.webp',
    'p5-p5-construction-branded.webp',
    'builder-bid-comparison.webp',
    'cost-breakdown-variance.webp',
    'consult-lifestyle.webp',
    'semi-custom-home.webp',
    'new-home-interior.webp',
    'new-home-kitchen.webp',
  ]) {
    assert.equal(served.includes(oldPath), false, oldPath);
  }
  assert.equal(served.includes('handyman-hero-door-hinge-branded.webp'), true);
});
