import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { getBlogImageAlt } from '../shared/blogImages.ts';
import { contentImageAlt } from '../shared/imageAlts.ts';

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

  // D9 / B-7: RE-10 is a referral page; homepage hero and gallery no longer require
  // a Representative imagery stamp. Legacy marketing sections may still use it.
  assert.equal(read('app/re-10-repairs-boise/page.tsx').includes('Representative imagery'), false);
  assert.equal(read('components/approved/ApprovedHome.tsx').includes('Representative imagery'), false);
  assert.equal(read('components/sections/ProjectGallerySection.tsx').includes('Representative imagery'), false);
  assert.equal(read('app/about/page.tsx').includes('Representative imagery'), false);
  assert.equal(read('components/approved/ApprovedHome.tsx').includes('Coordinated framing and mechanical rough-in'), false);

  for (const file of [
    'components/sections/StatementBandSection.tsx',
    'components/sections/ProcessSection.tsx',
    'components/sections/ValueOverheadSection.tsx',
    'components/sections/WhyChooseUsSection.tsx',
    'components/sections/HeroSection.tsx',
    'components/sections/FeaturedBeforeAfterSection.tsx',
    'components/seo/LandingPageTemplate.tsx',
    'app/contact/page.tsx',
  ]) {
    assert.match(read(file), /Representative imagery|Representative image:/, file);
  }

  const about = read('app/about/page.tsx');
  assert.match(about, /About Boise Construction Co/);
  assert.match(about, /P5 Home Co LLC, Idaho Registered Contractor #8381215|CONTRACTOR_REGISTRATION_LABEL/);
  assert.match(about, /1-year workmanship warranty|\/warranty/);

  const slider = read('components/BeforeAfterSlider.tsx');
  assert.equal(slider.includes('>Before<'), false);
  assert.equal(slider.includes('>After<'), false);
  assert.match(slider, /Compare the two views/);

  const gallery = read('components/sections/ProjectGallerySection.tsx');
  assert.equal(gallery.includes('Our work</p>'), false);
  assert.equal(gallery.includes('Recent homes we have designed'), false);
  assert.match(gallery, /Concept design/);
  assert.equal(read('app/areas/[city]/page.tsx').includes('Recent ${city.name} projects'), false);
  assert.equal(read('components/seo/LandingPageTemplate.tsx').includes('Proof of work'), false);

  const galleryData = read('shared/galleryData.ts');
  assert.match(galleryData, /Eagle Foothills Mountain-Modern Concept/);
  assert.equal(galleryData.includes('craftsman'), false);
  assert.equal(galleryData.includes('farmhouse'), false);
});
