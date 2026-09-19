// Explicit opt-in only; not part of default test discovery.
// Run with the existing sanitized, network-blocked harness:
// node scripts/offline-run.mjs test scripts/verify-p5-private-catalog-acceptance.mts
// No private catalog is committed. Absence/invalidity is a hard failure.
import assert from 'node:assert/strict';
assert.match(process.env.NODE_OPTIONS||'',/offline-network-guard\.cjs/,
  'Private verification must run through scripts/offline-run.mjs');
process.env.P5_ACCEPTANCE_POLICY_PATH='.local/diagnostics/acceptance/owner-policy.json';
await import('../tests/p5-real-catalog-acceptance.test.ts');