import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { clarityFormMaskScript } from '../lib/clarityFormMask.ts';

type FakeEl = {
  nodeType: number;
  tag: string;
  tagName: string;
  type: string;
  attrs: Record<string, string>;
  children: FakeEl[];
  parentElement: FakeEl | null;
  append: (child: FakeEl) => void;
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
  querySelectorAll: (selector: string) => FakeEl[];
};

function el(tag: string, children: FakeEl[] = [], type = ''): FakeEl {
  const node = {
    nodeType: 1,
    tag,
    tagName: tag.toUpperCase(),
    type: type || (tag === 'input' ? 'text' : ''),
    attrs: {} as Record<string, string>,
    children: [] as FakeEl[],
    parentElement: null as FakeEl | null,
    append(child: FakeEl) {
      child.parentElement = this;
      this.children.push(child);
    },
    getAttribute(name: string) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    },
    setAttribute(name: string, value: string) {
      this.attrs[name] = value;
    },
    querySelectorAll(selector: string) {
      const tags = selector.split(',').map((part) => part.trim().toLowerCase());
      const out: FakeEl[] = [];
      const walk = (current: FakeEl) => {
        if (tags.includes(current.tag)) out.push(current);
        current.children.forEach(walk);
      };
      this.children.forEach(walk);
      return out;
    },
  };
  if (type) node.attrs.type = type;
  children.forEach((child) => node.append(child));
  return node;
}

function masked(node: FakeEl): boolean {
  return node.attrs['data-clarity-mask'] === 'True';
}

type Observer = { callback: (mutations: Array<{ addedNodes?: FakeEl[] }>) => void };

function run(root: FakeEl) {
  const observers: Observer[] = [];
  const documentQueries: unknown[] = [];
  class MutationObserver {
    callback: Observer['callback'];
    constructor(callback: Observer['callback']) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
  }
  const document = {
    nodeType: 9,
    readyState: 'complete',
    documentElement: root,
    addEventListener() {},
    querySelectorAll(selector: string) {
      documentQueries.push(document);
      return root.querySelectorAll(selector);
    },
  };
  new Function('document', 'MutationObserver', clarityFormMaskScript)(document, MutationObserver);
  return { observers, documentQueries };
}

test('a masked form covers nested project text and leaves a checkbox parent unmarked', () => {
  const projectCopy = el('div');
  const checkbox = el('input', [], 'checkbox');
  const label = el('label', [checkbox]);
  const address = el('input');
  const preferred = el('button');
  const form = el('form', [projectCopy, label, address, preferred]);
  const root = el('html', [el('body', [form])]);
  run(root);
  assert.equal(masked(form), true);
  assert.equal(masked(projectCopy), false);
  assert.equal(masked(label), false);
  assert.equal(masked(checkbox), false);
  assert.equal(masked(address), true);
  assert.equal(masked(preferred), false);
});

test('a checkbox, radio, range, or button input with no masked ancestor marks its parent', () => {
  const checkbox = el('input', [], 'checkbox');
  const checkboxParent = el('div', [checkbox]);
  const radio = el('input', [], 'radio');
  const radioParent = el('label', [radio]);
  const range = el('input', [], 'range');
  const rangeParent = el('div', [range]);
  const buttonInput = el('input', [], 'button');
  const buttonParent = el('div', [buttonInput]);
  const typed = el('input');
  const typedParent = el('div', [typed]);
  const root = el('html', [el('body', [checkboxParent, radioParent, rangeParent, buttonParent, typedParent])]);
  run(root);
  for (const parent of [checkboxParent, radioParent, rangeParent, buttonParent]) {
    assert.equal(masked(parent), true);
  }
  assert.equal(masked(checkbox), false);
  assert.equal(masked(typed), true);
  assert.equal(masked(typedParent), false);
});

test('a mutation masks only the added node', () => {
  const existing = el('input');
  const untouched = el('div');
  const body = el('body', [existing, untouched]);
  const root = el('html', [body]);
  const { observers, documentQueries } = run(root);
  assert.equal(masked(existing), true);
  assert.equal(documentQueries.length, 1);
  const addedChoice = el('input', [], 'checkbox');
  const addedParent = el('div', [addedChoice]);
  const addedForm = el('form', [el('p'), addedParent]);
  observers[0].callback([{ addedNodes: [addedForm] }]);
  assert.equal(documentQueries.length, 1);
  assert.equal(masked(addedForm), true);
  assert.equal(masked(addedParent), false);
  assert.equal(masked(untouched), false);
});

test('the root layout installs the Clarity mask before the Clarity tag', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  const maskAt = layout.indexOf('id="clarity-form-mask"');
  const clarityAt = layout.indexOf('<MicrosoftClarity />');
  assert.ok(maskAt > 0);
  assert.ok(clarityAt > maskAt);
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.equal(readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8').includes('data-clarity-mask'), false);
});

test('the consultation success screen and assistant transcript are masked', () => {
  const entry = readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  assert.match(entry, /export\s*\{\s*QuoteRequestWizard as ConsultationForm,\s*QuoteRequestWizard\s*\}\s*from\s*["']\.\/QuoteRequestWizard["']/);
  const consult = readFileSync(new URL('../components/QuoteRequestWizard.tsx', import.meta.url), 'utf8');
  const successAt = consult.indexOf('data-testid="consultation-success"');
  assert.ok(successAt >= 0, 'the active wizard exposes its consultation success screen');
  assert.match(consult.slice(successAt, successAt + 120), /data-clarity-mask="True"/);
  const assistant = readFileSync(new URL('../components/assistant/AssistantWidget.tsx', import.meta.url), 'utf8');
  const logAt = assistant.indexOf('role="log"');
  assert.match(assistant.slice(logAt, logAt + 220), /data-clarity-mask="True"/);
});
