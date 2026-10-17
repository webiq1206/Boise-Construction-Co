import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {clarityFieldMaskBootstrap} from '../lib/clarityFieldMask.ts';

type Node = {
  nodeType: number;
  nodeName: string;
  parentNode: Node | null;
  children: Node[];
  attrs: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | undefined;
  querySelectorAll: (selector: string) => Node[];
};

function element(name: string, attrs: Record<string, string> = {}): Node {
  const node: Node = {
    nodeType: 1,
    nodeName: name.toUpperCase(),
    parentNode: null,
    children: [],
    attrs: {...attrs},
    setAttribute(attr, value) {
      node.attrs[attr] = value;
    },
    getAttribute(attr) {
      return node.attrs[attr];
    },
    querySelectorAll(selector) {
      const names = selector.split(',').map((part) => part.trim().toUpperCase());
      const found: Node[] = [];
      const walk = (current: Node) => {
        if (names.includes(current.nodeName)) found.push(current);
        current.children.forEach(walk);
      };
      node.children.forEach(walk);
      return found;
    },
  };
  return node;
}

function append(parent: Node, child: Node) {
  child.parentNode = parent;
  parent.children.push(child);
  return child;
}

function install(body: Node) {
  const document = {
    readyState: 'complete',
    body,
    nodeType: 9,
    querySelectorAll: (selector: string) => body.querySelectorAll(selector),
    addEventListener() {},
  };
  let callback: ((records: Array<{addedNodes: Node[]}>) => void) | undefined;
  class MutationObserver {
    constructor(fn: (records: Array<{addedNodes: Node[]}>) => void) {
      callback = fn;
    }
    observe() {}
  }
  vm.runInNewContext(clarityFieldMaskBootstrap(), {document, MutationObserver});
  return callback;
}

test('a form masks its echoed text, and a checkbox outside a form masks its parent', () => {
  const body = element('body');
  const form = append(body, element('form'));
  const echo = append(form, element('p'));
  const sent = append(form, element('p'));
  const suggestions = append(form, element('ul'));
  const radio = append(form, element('button'));
  const label = append(form, element('label'));
  append(label, element('input', {type: 'checkbox'}));
  const loose = append(body, element('label'));
  const box = append(loose, element('input', {type: 'checkbox'}));

  install(body);

  assert.equal(form.attrs['data-clarity-mask'], 'True');
  assert.equal(echo.parentNode, form);
  assert.equal(sent.parentNode, form);
  assert.equal(suggestions.parentNode, form);
  assert.equal(radio.parentNode, form);
  assert.equal(label.attrs['data-clarity-mask'], undefined);
  assert.equal(loose.attrs['data-clarity-mask'], 'True');
  assert.equal(box.attrs['data-clarity-mask'], 'True');
});

test('mutations mask only the added node', () => {
  const body = element('body');
  const callback = install(body);
  const added = element('form');
  append(added, element('p'));
  const boxParent = element('label');
  append(boxParent, element('input', {type: 'checkbox'}));
  assert.equal(typeof callback, 'function');
  callback?.([{addedNodes: [added, boxParent]}]);
  assert.equal(added.attrs['data-clarity-mask'], 'True');
  assert.equal(boxParent.attrs['data-clarity-mask'], 'True');
  assert.equal(body.attrs['data-clarity-mask'], undefined);
});

test('the mask script is in the document head, ahead of Clarity', () => {
  const layout = fs.readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  const mask = layout.indexOf('id="p5-clarity-mask"');
  const clarity = layout.indexOf('<MicrosoftClarity />');
  assert.ok(mask > 0 && clarity > mask);
  const script = clarityFieldMaskBootstrap();
  assert.match(script, /querySelectorAll\('form,input,textarea,select'\)/);
  assert.match(script, /type==='checkbox'\|\|type==='radio'\|\|type==='range'\|\|type==='button'/);
});

test('a checkbox parent is never body or html', () => {
  const body = element('body');
  append(body, element('input', {type: 'checkbox'}));
  install(body);
  assert.equal(body.attrs['data-clarity-mask'], undefined);

  const html = element('html');
  const radio = append(html, element('input', {type: 'radio'}));
  const document = {
    readyState: 'complete',
    body: html,
    nodeType: 9,
    querySelectorAll: (selector: string) => html.querySelectorAll(selector),
    addEventListener() {},
  };
  class MutationObserver {
    constructor(_fn: (records: Array<{addedNodes: Node[]}>) => void) {}
    observe() {}
  }
  vm.runInNewContext(clarityFieldMaskBootstrap(), {document, MutationObserver});
  assert.equal(html.attrs['data-clarity-mask'], undefined);
  assert.equal(radio.attrs['data-clarity-mask'], 'True');
});

test('the consultation success state masks the name and address', () => {
  const source = fs.readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  assert.match(source, /data-testid="consultation-success"[^>]*data-clarity-mask="True"/);
});

test('the assistant transcript is masked', () => {
  const source = fs.readFileSync(new URL('../components/assistant/AssistantWidget.tsx', import.meta.url), 'utf8');
  assert.match(source, /role="log"[\s\S]{0,120}data-clarity-mask="True"/);
});
