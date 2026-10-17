import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {clarityFieldMaskBootstrap} from '../lib/clarityFieldMask.ts';

type Node = {
  nodeType: number;
  nodeName: string;
  children: Node[];
  attrs: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
  querySelectorAll: (selector: string) => Node[];
};

function element(name: string): Node {
  const node: Node = {
    nodeType: 1,
    nodeName: name.toUpperCase(),
    children: [],
    attrs: {},
    setAttribute(attr, value) {
      node.attrs[attr] = value;
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

test('every form field receives data-clarity-mask="True", including fields added later', () => {
  const body = element('body');
  const form = element('form');
  const name = element('input');
  const notes = element('textarea');
  const service = element('select');
  const button = element('button');
  form.children.push(name, notes, service, button);
  body.children.push(form);
  const document = {
    readyState: 'complete',
    body,
    querySelectorAll: (selector: string) => body.querySelectorAll(selector),
    addEventListener() {},
  };
  let observer: {records: Array<{addedNodes: Node[]}>} | undefined;
  class MutationObserver {
    constructor(private callback: (records: Array<{addedNodes: Node[]}>) => void) {}
    observe() {
      observer = {records: []};
      (observer as {callback?: typeof this.callback}).callback = this.callback;
    }
  }
  vm.runInNewContext(clarityFieldMaskBootstrap(), {document, MutationObserver});
  for (const field of [name, notes, service]) {
    assert.equal(field.attrs['data-clarity-mask'], 'True');
  }
  assert.equal(button.attrs['data-clarity-mask'], undefined);

  const phone = element('input');
  const nested = element('div');
  const email = element('input');
  nested.children.push(email);
  const callback = (observer as {callback?: (records: Array<{addedNodes: Node[]}>) => void} | undefined)?.callback;
  assert.equal(typeof callback, 'function');
  callback?.([{addedNodes: [phone, nested]}]);
  assert.equal(phone.attrs['data-clarity-mask'], 'True');
  assert.equal(email.attrs['data-clarity-mask'], 'True');
});

test('the mask script is in the document head, ahead of Clarity', () => {
  const layout = fs.readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  const mask = layout.indexOf('id="p5-clarity-mask"');
  const clarity = layout.indexOf('<MicrosoftClarity />');
  assert.ok(mask > 0 && clarity > mask);
  const script = clarityFieldMaskBootstrap();
  assert.match(script, /querySelectorAll\('input,textarea,select'\)/);
  assert.match(script, /setAttribute\(attr,'True'\)/);
});
