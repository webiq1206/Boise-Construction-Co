import test from 'node:test';
import assert from 'node:assert/strict';
import { preferToTextLine, TEXT_REPLY_HOURS } from '../shared/siteConfig.ts';

test('the Prefer to text line uses the one hours constant, including Saturday', () => {
  assert.equal(TEXT_REPLY_HOURS, 'Mon–Fri 9–6, Sat 9–4 MT');
  assert.equal(
    preferToTextLine(),
    'Prefer to text? Text (208) 477-1169. We reply in minutes during business hours (Mon–Fri 9–6, Sat 9–4 MT).',
  );
  assert.equal(preferToTextLine().split(TEXT_REPLY_HOURS).length, 2);
});
