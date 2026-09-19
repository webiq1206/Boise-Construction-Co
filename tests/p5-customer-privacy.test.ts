import test from 'node:test';
import assert from 'node:assert/strict';
import {customerText,projectCustomerEstimate} from '../lib/p5/customerProjection.ts';
import {estimateSections,categoryBreakdown} from '../lib/p5/presentation.ts';
import {estimateEmail} from '../lib/p5/estimateEmail.ts';
import {customerPdf} from '../lib/p5/pdf.ts';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

// Isolated regression for the shape of a historical saved result. No provider,
// storage or customer delivery is used, and no sealed evidence is rewritten.
const oldResult={
 status:'planning-range',range:{low:350,high:450},summary:'Install 100 LF of trim.',
 includedCategories:['Carpentry'],categoryRanges:[{category:'Carpentry',low:350,high:450}],
 lineItems:[{id:'trim',category:'Carpentry',description:'Trim installation',quantity:100,unit:'LF',low:350,high:450,unitLow:3.5,unitHigh:4.5,unitCost:2,evidence:{reference:'private catalog'},rateSources:['private source'],pricingStatus:'estimated-allowance'}],
 allowances:[],assumptions:['100 LF of trim at $2.00/LF ($200.00 direct cost). Preliminary allowance, not a supplier quote. Confirm local pricing and selections.'],
 exclusions:['Painting excluded.'],factors:[],nextStep:'Confirm scope.',message:'Planning estimate.',disclaimer:'Not a bid.',
 internal:{directCost:200,margin:.2},costBookSnapshot:{private:true},
 verificationItems:['Regional planning average, not verified local pricing: $2.00/LF. Confirm quantities.'],
};
test('prose redacts rate and margin variants, not scope quantities or nonfinancial percentages',()=>{
 const safe='Allow 10% waste; roof pitch 25%; install 100 LF and 2 per room. Not verified local pricing.';
 assert.equal(customerText(safe),safe);
 for(const privateText of ['2.00/LF','2.00 USD/each','USD 2.00/each','margin 20%','20% margin','overhead: 20%','profit at 25%']){
  const output=customerText(privateText);
  assert.doesNotMatch(output,/2\.00|20%|25%/,privateText);
 }
});
test('spelled-out bare unit rates and extended cost arithmetic stay private',()=>{
 for(const rate of ['1.25 per linear foot','3.00 per square foot','5 per gallon','2.00 per pound','2 per LF','3/EA','4 per cubic yard','6 per lineal foot']){
  assert.equal(customerText(rate),'[pricing detail withheld]',rate);
 }
 const arithmetic='Trim: 100 LF x 2 =200. Allow 10% waste; confirm local pricing.';
 assert.equal(customerText(arithmetic),'Trim: 100 LF ([pricing detail withheld]). Allow 10% waste; confirm local pricing.');
 assert.equal(customerText('100 LF × 2.00 = 200.00'),'100 LF ([pricing detail withheld])');
 for(const scope of ['5 nails per linear foot','2 gallons per room','100 LF of trim','2 per room','3 per wall','10 x 12 feet','2 x 4 studs','5 gallons cover 400 square feet','Roof pitch 25%; allow 10% waste.']){
  assert.equal(customerText(scope),scope);
 }
 const projected=projectCustomerEstimate({...oldResult,assumptions:[arithmetic,'Allowance: 5 per gallon; not a supplier quote.']});
 assert.equal(projected.lineItems[0].quantity,100);
 assert.equal(projected.lineItems[0].unitLow,3.5);
 assert.deepEqual(projected.range,oldResult.range);
 assert.doesNotMatch(JSON.stringify(projected.assumptions),/x 2|=200|5 per gallon/);
 assert.match(projected.assumptions.join(' '),/not a supplier quote/);
});
test('generated evidence ranges and verbose financial ratios hide every cost bound',()=>{
 const evidence='Regional planning average: 20 to 30 USD/SF. Allow 10% waste; not verified local pricing.';
 assert.equal(customerText(evidence),'Regional planning average: [pricing detail withheld]. Allow 10% waste; not verified local pricing.');
 assert.equal(customerText('2.50 to 3.75 USD/LF; confirm quantities.'),'[pricing detail withheld]; confirm quantities.');
 assert.equal(customerText('operating profit target is 20%; overhead allocation of 0.2; allow 10% waste.'),
  '[pricing detail withheld]; [pricing detail withheld]; allow 10% waste.');
});
test('historical projection hides costs without changing selling arithmetic, scope or original evidence',()=>{
 const before=JSON.stringify(oldResult);
 const result=projectCustomerEstimate(oldResult);
 const text=JSON.stringify(result);
 assert.doesNotMatch(text,/\$2\.00|\$200\.00|unitCost|private catalog|rateSources|directCost|costBookSnapshot/);
 assert.deepEqual(result.range,oldResult.range);
 assert.equal(result.lineItems[0].quantity,100);
 assert.equal(result.lineItems[0].unitLow,3.5);
 assert.match(text,/Preliminary allowance, not a supplier quote/);
 assert.match(text,/Painting excluded/);
 assert.equal(JSON.stringify(oldResult),before);
 assert.deepEqual(projectCustomerEstimate(result),result);
});
test('saved-result customer sections, page breakdown and email reapply the boundary',()=>{
 const sections=JSON.stringify(estimateSections(oldResult));
 assert.doesNotMatch(sections,/\$2\.00|\$200\.00/);
 assert.match(sections,/Confirm local pricing/);
 assert.equal(categoryBreakdown(oldResult)[0].items[0].unitLow,3.5);
 const email=estimateEmail('offline-test',{customer:oldResult,internal:{directCost:200}},false);
 assert.doesNotMatch(email.html+email.text,/\$2\.00|\$200\.00|private catalog/);
 assert.match(email.text,/100 LF/);
 assert.match(email.text,/\$350/);
 const admin=estimateEmail('offline-test',{customer:oldResult,internal:{directCost:200}},true);
 assert.match(admin.text,/Direct project cost: \$200/);
});
test('historical customer PDF hides prose rates while keeping selling totals and caveats',async()=>{
 const bytes=await customerPdf('offline-privacy',oldResult);
 const loading=getDocument({data:new Uint8Array(bytes),useSystemFonts:true});
 const pdf=await loading.promise;
 try{
  const pages:string[]=[];
  for(let n=1;n<=pdf.numPages;n++){
   const page=await pdf.getPage(n),content=await page.getTextContent();
   pages.push(content.items.map(item=>'str' in item?item.str:'').join(' '));
  }
  const text=pages.join(' ');
  assert.doesNotMatch(text,/\$2\.00|\$200\.00|private catalog/);
  assert.match(text,/\$350/);
  assert.match(text,/100 LF/);
  assert.match(text,/not a supplier quote/);
 }finally{await loading.destroy();}
});