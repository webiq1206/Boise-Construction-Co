import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
