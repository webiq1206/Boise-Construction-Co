import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  VENDOR_LOAD_EVENTS,
  VENDOR_LOAD_TIMEOUT_MS,
  deferVendorLoad,
  loadAtWindowLoad,
  vendorScriptTag,
} from '../lib/deferredVendorScript.ts';

/** A window with listeners, a fake clock and a script list, enough to run the inline loaders. */
function sandbox(readyState: 'loading' | 'complete' = 'loading') {
  const listeners = new Map<string, Set<() => void>>();
  const timers: { at: number; fn: () => void }[] = [];
  let now = 0;
  const inserted: string[] = [];
  const firstScript = { parentNode: { insertBefore: (el: { src: string }) => inserted.push(el.src) } };
  const document = {
    readyState,
    createElement: () => ({ async: false, src: '' }),
    getElementsByTagName: () => [firstScript],
    head: { appendChild: (el: { src: string }) => inserted.push(el.src) },
  };
  const context: Record<string, unknown> = {
    document,
    addEventListener: (type: string, fn: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: () => void) => listeners.get(type)?.delete(fn),
    setTimeout: (fn: () => void, ms: number) => timers.push({ at: now + ms, fn }) - 1,
    clearTimeout: (id: number) => { if (timers[id]) timers[id].fn = () => {}; },
  };
  context.window = context;
  vm.createContext(context);
  return {
    context,
    inserted,
    run: (code: string) => vm.runInContext(code, context),
    fire: (type: string) => [...(listeners.get(type) ?? [])].forEach((fn) => fn()),
    listening: (type: string) => (listeners.get(type)?.size ?? 0) > 0,
    advance: (ms: number) => {
      now += ms;
      for (const t of timers.filter((t) => t.at <= now)) { const fn = t.fn; t.fn = () => {}; fn(); }
    },
  };
}

const SRC = 'https://vendor.example/tag.js';

test('the timeout is never under five seconds and the four interaction events are the trigger', () => {
  assert.ok(VENDOR_LOAD_TIMEOUT_MS >= 5000);
  assert.deepEqual([...VENDOR_LOAD_EVENTS], ['pointerdown', 'keydown', 'scroll', 'touchstart']);
});

test('nothing is requested before interaction; the first interaction loads the tag once', () => {
  for (const event of VENDOR_LOAD_EVENTS) {
    const s = sandbox();
    s.run(deferVendorLoad(vendorScriptTag(SRC)));
    assert.deepEqual(s.inserted, [], 'no request at run time');
    s.fire('load');
    s.advance(VENDOR_LOAD_TIMEOUT_MS - 1);
    assert.deepEqual(s.inserted, [], 'no request before the timeout');
    s.fire(event);
    assert.deepEqual(s.inserted, [SRC], event);
    for (const other of VENDOR_LOAD_EVENTS) assert.equal(s.listening(other), false, 'listeners removed');
    s.advance(VENDOR_LOAD_TIMEOUT_MS);
    s.fire('scroll');
    assert.deepEqual(s.inserted, [SRC], 'loaded exactly once');
  }
});

test('without interaction the tag loads five seconds after load, not before', () => {
  const s = sandbox();
  s.run(deferVendorLoad(vendorScriptTag(SRC)));
  s.advance(60_000); // the clock only starts at the load event
  assert.deepEqual(s.inserted, []);
  s.fire('load');
  s.advance(VENDOR_LOAD_TIMEOUT_MS - 1);
  assert.deepEqual(s.inserted, []);
  s.advance(1);
  assert.deepEqual(s.inserted, [SRC]);
});

test('a page that already finished loading starts the five second clock at once', () => {
  const s = sandbox('complete');
  s.run(deferVendorLoad(vendorScriptTag(SRC)));
  s.advance(VENDOR_LOAD_TIMEOUT_MS - 1);
  assert.deepEqual(s.inserted, []);
  s.advance(1);
  assert.deepEqual(s.inserted, [SRC]);
});

test('Meta loads at the window load event: no interaction wait, no 5 second wait', () => {
  const s = sandbox();
  s.run(loadAtWindowLoad(vendorScriptTag(SRC)));
  assert.deepEqual(s.inserted, [], 'nothing before load');
  for (const event of VENDOR_LOAD_EVENTS) s.fire(event);
  assert.deepEqual(s.inserted, [], 'interaction alone does not load it before the load event');
  s.fire('load');
  assert.deepEqual(s.inserted, [SRC], 'loaded at the load event, with no timer');
  s.fire('load');
  s.advance(VENDOR_LOAD_TIMEOUT_MS * 2);
  assert.deepEqual(s.inserted, [SRC], 'loaded exactly once');
  const done = sandbox('complete');
  done.run(loadAtWindowLoad(vendorScriptTag(SRC)));
  assert.deepEqual(done.inserted, [SRC], 'a page that already loaded requests it at once');
});

test('the Meta stub queues PageView and later events, and fbevents.js loads at window load', () => {
  const pixel = readFileSync(new URL('../components/MetaPixel.tsx', import.meta.url), 'utf8');
  // Owner decision 1 November 2026: Meta loads at window load, not deferred to interaction.
  assert.match(pixel, /loadAtWindowLoad\(vendorScriptTag\('https:\/\/connect\.facebook\.net\/en_US\/fbevents\.js'\)\)/);
  assert.doesNotMatch(pixel, /deferVendorLoad/);
  assert.equal(pixel.match(/https:\/\/connect\.facebook\.net/g)?.length, 1);
  const inline = pixel.slice(pixel.indexOf('{`') + 2, pixel.indexOf('`}'))
    .replaceAll('${META_PIXEL_ID}', 'TEST')
    .replace(/\$\{loadAtWindowLoad\(vendorScriptTag\('([^']+)'\)\)\}/, (_, src) => loadAtWindowLoad(vendorScriptTag(src)));
  const s = sandbox();
  s.run(inline);
  assert.deepEqual(s.inserted, []);
  s.run("fbq('track','Lead',{},{eventID:'e1'})");
  const queue = Array.from((s.context.fbq as { queue: unknown[][] }).queue, (args) => [...args].slice(0, 2).join(' '));
  assert.deepEqual(queue, ['set autoConfig', 'init TEST', 'track PageView', 'track Lead']);
  s.fire('load');
  assert.deepEqual(s.inserted, ['https://connect.facebook.net/en_US/fbevents.js']);
});

test('the Clarity stub queues calls and its tag waits for interaction', () => {
  const source = readFileSync(new URL('../components/MicrosoftClarity.tsx', import.meta.url), 'utf8');
  assert.match(source, /deferVendorLoad\(vendorScriptTag\(`https:\/\/www\.clarity\.ms\/tag\/\$\{CLARITY_PROJECT_ID\}\?ref=bwt`\)\)/);
  assert.equal(source.match(/https:\/\/www\.clarity\.ms/g)?.length, 1);
  assert.doesNotMatch(source, /lazyOnload/);
  const stub = source.slice(source.indexOf('__html: `') + 9, source.indexOf('\n${deferVendorLoad'));
  const s = sandbox();
  s.run(stub);
  s.run("clarity('set','page','test')");
  assert.equal((s.context.clarity as { q: unknown[] }).q.length, 1);
});
