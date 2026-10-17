import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);

function read(file: string): string {
  return fs.readFileSync(new URL(file, root), 'utf8');
}

const masked = [
  'components/ConsultationForm.tsx',
  'components/P5Estimator.tsx',
  'components/P5AddressInput.tsx',
  'components/AddressAutocomplete.tsx',
  'components/P5ExitOffer.tsx',
  'components/P5ProjectReview.tsx',
  'components/P5ReviewRequest.tsx',
  'components/P5IntakeReview.tsx',
  'components/estimate/recovery/AbandonmentPrompt.tsx',
  'components/assistant/AssistantWidget.tsx',
  'components/modals/ModalProvider.tsx',
  'app/estimate/page.tsx',
  'components/StripePaymentForm.tsx',
  'components/marketing/BlogIndexClient.tsx',
  'components/MillworkPanel.tsx',
];

test('form containers that collect visitor text set the Clarity mask', () => {
  for (const file of masked) {
    assert.equal(read(file).includes('data-clarity-mask="true"'), true, file);
  }
  const consult = read('components/ConsultationForm.tsx');
  assert.match(consult, /data-testid="consultation-success"[^>]*data-clarity-mask="true"/);
  assert.match(consult, /<form\n\s+data-clarity-mask="true"/);
  assert.match(read('components/P5Estimator.tsx'), /<form id=\{formId\}[^>]*data-clarity-mask="true"/);
  assert.match(read('components/P5Estimator.tsx'), /className=\{styles\.composer\} data-clarity-mask="true"/);
});

test('Meta pixel turns off automatic advanced matching before init and passes no user data', () => {
  const pixel = read('components/MetaPixel.tsx');
  const setAt = pixel.indexOf("fbq('set','autoConfig',false,'${META_PIXEL_ID}');");
  const initAt = pixel.indexOf("fbq('init','${META_PIXEL_ID}');");
  assert.equal(setAt > 0, true);
  assert.equal(initAt > setAt, true);
  assert.equal(/fbq\('init','\$\{META_PIXEL_ID\}',\s*\{/.test(pixel), false);
});
