import test from 'node:test';
import assert from 'node:assert/strict';
import {filesForPlanAnalysis} from '../app/api/plans/analyze/route.ts';
import {filesForRe10Analysis} from '../app/api/re10/analyze/route.ts';

const pdf={filename:'plans.pdf',mimeType:'application/pdf',data:Buffer.from('%PDF-fixture')};
const sheet={filename:'scope.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',data:Buffer.from('xlsx-fixture')};

test('plan analyze route retains XLSX in mixed coverage input',()=>{
 assert.deepEqual(filesForPlanAnalysis([pdf,sheet]).map(file=>file.filename),['plans.pdf','scope.xlsx']);
 assert.deepEqual(filesForPlanAnalysis([sheet]),[]);
});

test('RE-10 analyze route retains XLSX in mixed coverage input',()=>{
 assert.deepEqual(filesForRe10Analysis([pdf,sheet]).map(file=>file.filename),['plans.pdf','scope.xlsx']);
 assert.deepEqual(filesForRe10Analysis([sheet]),[]);
});