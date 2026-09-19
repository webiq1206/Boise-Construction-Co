import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {buildPageManifest,MAX_DOCUMENT_BYTES,MAX_DOCUMENT_PAGES,MAX_DOCUMENT_TOTAL_BYTES} from '../server/services/documents/pageInventory.ts';
import {buildCoverageLedger} from '../server/services/documents/coverage.ts';
import {MAX_PLAN_PAGES,MAX_PLAN_TOTAL_BYTES} from '../shared/plans/upload.ts';

async function pdfWithPages(count:number){
 const pdf=await PDFDocument.create();
 for(let i=0;i<count;i++)pdf.addPage();
 return Buffer.from(await pdf.save());
}

test('mixed source manifest deduplicates identical bytes without conflating distinct names',async()=>{
 const photo=Buffer.from('same physical photo');
 const manifest=await buildPageManifest([
  {filename:'plans.pdf',mimeType:'application/pdf',data:await pdfWithPages(2)},
  {filename:'site.jpg',mimeType:'image/jpeg',data:photo},
  {filename:'renamed-copy.jpg',mimeType:'image/jpeg',data:Buffer.from(photo)},
  {filename:'other.jpg',mimeType:'image/jpeg',data:Buffer.from('different photo')},
 ]);
 assert.equal(manifest.totalPages,4);
 assert.deepEqual(manifest.pages.map(page=>page.filename),['plans.pdf','plans.pdf','site.jpg','other.jpg']);
 assert.deepEqual(manifest.pages.map(page=>page.id),['0:1','0:2','1:1','2:1']);
 assert.equal(new Set(manifest.pages.map(page=>page.id)).size,4);
});

test('coverage is incomplete for empty or skipped evidence even if no page is missing',()=>{
 const base={allPages:[],manifestUnreadable:[],reportedRead:[],reportedUnreadable:[],failedChunks:[]};
 assert.equal(buildCoverageLedger({...base,skippedFiles:[]}).complete,false);
 assert.equal(buildCoverageLedger({...base,skippedFiles:[{filename:'scope.xlsx',reason:'unsupported'}]}).complete,false);
});

test('document and plan admission share exact 250 MiB and 250 page ceilings',async()=>{
 assert.equal(MAX_DOCUMENT_BYTES,250*1024*1024);
 assert.equal(MAX_DOCUMENT_TOTAL_BYTES,MAX_DOCUMENT_BYTES);
 assert.equal(MAX_DOCUMENT_PAGES,250);
 assert.equal(MAX_PLAN_TOTAL_BYTES,MAX_DOCUMENT_BYTES);
 assert.equal(MAX_PLAN_PAGES,MAX_DOCUMENT_PAGES);
 const exact=await buildPageManifest([{filename:'exact.pdf',mimeType:'application/pdf',data:await pdfWithPages(250)}]);
 assert.equal(exact.totalPages,250);
 await assert.rejects(
  buildPageManifest([{filename:'too-many.pdf',mimeType:'application/pdf',data:await pdfWithPages(251)}]),
  /250 pages/,
 );
});