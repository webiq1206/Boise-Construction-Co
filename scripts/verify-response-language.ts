/**
 * Build guard: no inquiry response-time promises anywhere a customer, the
 * assistant, a search engine or the team could read them.
 *
 * Owner instruction: say that we answer, and do not say "within one business
 * day" (or any replacement timing) on any site. That covers visible copy,
 * metadata, JSON-LD, FAQ data, llms.txt, form success and callback states,
 * abandonment prompts, assistant tool output, customer emails, internal
 * callback notices that quote the promise, and GBP reference copy.
 *
 * Text is whitespace-normalized before matching, and JSX spacer fragments
 * ({" "} / {' '}) are removed, so a phrase split across lines or JSX nodes is
 * still caught.
 *
 * NOT in scope, and deliberately not matched: the 24-hour cancellation notice
 * in app/terms-of-service, work durations, permit review times, payment timing,
 * rate caps, cron buckets and clock formats. The patterns below only target
 * reply/response promises.
 *
 * Run: node --import tsx scripts/verify-response-language.ts
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { extname, join, relative, sep } from 'path';

const ROOT = process.cwd();

const SCAN_ROOTS = ['app', 'components', 'shared', 'server', 'lib', 'hooks', 'content', 'public', 'local-seo-audit'];
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md', '.txt', '.json', '.html']);
const EXCLUDED_DIRS = new Set(['node_modules', '.next', '.git', 'images', 'fonts', 'videos', 'brand']);

// Built from parts so this file does not match itself if it is ever scanned.
const BD = 'business' + '[\\s-]+day';
const PROHIBITED: Array<{ label: string; re: RegExp }> = [
  { label: 'one/next business day', re: new RegExp(`\\b(?:one|1|next|a)[\\s-]+${BD}\\b`, 'i') },
  { label: 'reply/respond within', re: /\b(?:reply|replies|respond|responds|response|answer|answers|follow(?:s)? up|call(?:s)? (?:you )?back|get back to you)\s+within\b/i },
  { label: 'within 24 hours', re: /\bwithin\s+(?:24|twenty[\s-]four)\s*(?:hours?|hrs?|h)\b/i },
  { label: '24-hour reply', re: /\b24[\s-]?(?:hour|hr|h)\s+(?:reply|response|turnaround|call ?back|callback)\b/i },
  { label: 'reply in minutes', re: /\b(?:reply|replies|respond|responds|response|answers? (?:most |your )?questions)\s+(?:back\s+)?in (?:a |a few |\d+ )?minutes?\b/i },
  { label: 'answered in a minute', re: /\b(?:questions?|reply|replies|answers?|call|text|respond|responds)\b[^.]{0,30}\bin a minute\b/i },
  { label: 'response counter', re: /\b(?:to|until) (?:reply|respond|response)\b[^.]{0,20}\b(?:day|hour|minute)s?\b|\b(?:day|hour|minute)s? to (?:reply|respond)\b/i },
];

/** Files that may legitimately contain matching text, with the reason. */
const ALLOWED_FILES = new Map<string, string>([]);

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (EXCLUDED_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (SCAN_EXTENSIONS.has(extname(name)) && st.size < 5_000_000) out.push(full);
  }
}

export function normalize(text: string): string {
  return text
    .replace(/\{\s*(["'`])\s*\1\s*\}/g, ' ')
    .replace(/\{\s*"\s+"\s*\}|\{\s*'\s+'\s*\}/g, ' ')
    .replace(/\s+/g, ' ');
}

export function findProhibited(text: string): string[] {
  const normalized = normalize(text);
  const hits: string[] = [];
  for (const { label, re } of PROHIBITED) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    for (const m of normalized.matchAll(global)) {
      const start = Math.max(0, (m.index ?? 0) - 60);
      hits.push(`${label}: "...${normalized.slice(start, (m.index ?? 0) + m[0].length + 40).trim()}..."`);
    }
  }
  return hits;
}

function main(): void {
  // Self-test: the guard must catch the shapes that have actually shipped.
  const mustCatch = [
    'We reply within one business day.',
    'We reply within\n          one business day.',
    'Our team replies within one business day.',
    'A quick call or text answers most questions in a minute.',
    'We reply in minutes during business hours.',
    'Response within 1 business-day',
    '1 business day to reply',
  ];
  const mustPass = [
    'We answer your questions and help you work out the next step.',
    'Cancellation of scheduled services requires 24-hour advance notice',
    "Caldwell's first plan review typically takes 7 to 10 business days",
    'The estimator gives a planning range in minutes.',
  ];
  const selfTestFailures = [
    ...mustCatch.filter((s) => findProhibited(s).length === 0).map((s) => `guard missed: ${s}`),
    ...mustPass.filter((s) => findProhibited(s).length > 0).map((s) => `guard over-matched: ${s}`),
  ];
  if (selfTestFailures.length) {
    console.error('verify-response-language self-test failed:\n' + selfTestFailures.join('\n'));
    process.exit(1);
  }

  const files: string[] = [];
  for (const r of SCAN_ROOTS) walk(join(ROOT, r), files);

  const problems: string[] = [];
  for (const file of files) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (ALLOWED_FILES.has(rel)) continue;
    const hits = findProhibited(readFileSync(file, 'utf8'));
    for (const h of hits) problems.push(`${rel}: ${h}`);
  }

  if (problems.length) {
    console.error(
      `verify-response-language: ${problems.length} inquiry response-time promise(s) found.\n` +
        'Say that we answer questions and help with the next step, without a time frame.\n\n' +
        problems.join('\n'),
    );
    process.exit(1);
  }
  console.log(`verify-response-language: ${files.length} files clean.`);
}

main();
