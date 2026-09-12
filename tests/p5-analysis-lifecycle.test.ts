import test from 'node:test';
import assert from 'node:assert/strict';
import {analysisSourceVersion,analysisWorkKey} from '../lib/p5/analysisWork.ts';

const draft=(answers:any)=>({id:'00000000-0000-4000-8000-000000000000',uploads:[{id:'file-1',sha256:'abc'}],answers} as any);

test('answer changes reuse the same resumable document source',()=>{
  const first=draft({service:'bathroom'});
  const second=draft({service:'bathroom',sqft:'80'});
  assert.equal(analysisSourceVersion('Remodel the bathroom',first.uploads),analysisSourceVersion('Remodel the bathroom',second.uploads));
  assert.equal(analysisWorkKey(first,'Remodel the bathroom',first.answers),analysisWorkKey(second,'Remodel the bathroom',second.answers));
  assert.notEqual(analysisSourceVersion('Remodel the kitchen',first.uploads),analysisSourceVersion('Remodel the bathroom',first.uploads));
});