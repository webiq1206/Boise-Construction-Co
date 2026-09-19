import test from "node:test";
import assert from "node:assert/strict";
import { buildCrmPayload, CRM_PAYLOAD_MAX_BYTES, CRM_PROJECTION_VERSION } from "../lib/p5/crmPayload.ts";
import { syncCrm, crmTransportCode } from "../lib/p5/deliveryAdapter.ts";

// Deliberately synthetic, isolated fixture; no saved drafts, environment changes or live requests.
function fixture() {
  const lines = Array.from({length:80},(_,i)=>({
    id:`test-line-${i}`,category:"materials",description:`Fixture framing assembly ${i}`,
    quantity:10,unit:"sf",unitCost:12,cost:120,contingency:6,riskAdjustedCost:126,
    overheadRecovery:30,operatingProfit:30,sellingAmount:186,sellingUnitPrice:18.6,
    evidence:{reference:"TEST catalog evidence ".repeat(40)},quantitySource:"TEST drawing trace ".repeat(10),
  }));
  return {
    draftId:"12345678-1234-4123-8123-123456789abc",
    contact:{name:"TEST ONLY",email:"test@example.invalid",phone:"2085550100"},
    scope:{answers:{service:"new-construction",address:"TEST address",location:"Boise"},instructions:"Complete fixture scope ".repeat(600)},
    customer:{status:"priced",range:{low:14880,high:16000},summary:"TEST fixture project",
      lineItems:lines.map(line=>({id:line.id,description:line.description,quantity:line.quantity,unit:line.unit,low:186,high:200,unitLow:18.6,unitHigh:20})),
      exclusions:["TEST exclusion"],assumptions:["TEST assumption"]},
    internal:{revision:"test-revision",lines,directCost:9600,contractPrice:14880,operatingProfit:2400,
      costBookSnapshot:{catalog:"TEST catalog ".repeat(6000)},financeSnapshot:{test:"private"},
      scopePricing:{trace:"TEST trace ".repeat(4000)},
      warnings:Array.from({length:80},()=>({severity:"review",code:"fixture-warning",message:"TEST review detail ".repeat(10)}))},
  };
}
function options(fetcher:typeof fetch) {
  return {token:"TEST-ONLY-NOT-A-SECRET",url:"https://receiver.example.invalid/api/external/leads",fetch:fetcher};
}
test("versioned compact payload retains full scope, totals and every priced quantity/rate",()=>{
  const record=fixture(),before=JSON.stringify(record);
  const {payload,body,bytes}=buildCrmPayload(record,"test-key");
  assert.ok(Buffer.byteLength(before)>100*1024);
  assert.ok(bytes<CRM_PAYLOAD_MAX_BYTES);
  assert.equal(bytes,Buffer.byteLength(body,"utf8"));
  assert.equal(payload.estimate.projectionVersion,CRM_PROJECTION_VERSION);
  assert.deepEqual(payload.estimate.scope,record.scope);
  assert.deepEqual(payload.estimate.customer,record.customer);
  assert.equal(payload.estimate.internal.lines.length,80);
  assert.equal(payload.estimate.internal.lines[79].sellingUnitPrice,18.6);
  assert.equal(payload.estimate.internal.lines[79].quantity,10);
  assert.equal(payload.estimate.internal.financialSummary.contractPrice,14880);
  assert.match(payload.estimate.projectionNotice,/not the full/);
  assert.equal(payload.estimate.administrativeReference.authenticationRequired,true);
  assert.ok(!body.includes("costBookSnapshot"));
  assert.ok(!body.includes("TEST catalog evidence"));
  assert.equal(JSON.stringify(record),before);
});
test("UTF-8 oversize scope fails before fetch rather than truncating",async()=>{
  const record=fixture();record.scope.instructions="🏗".repeat(30000);
  let calls=0;
  await assert.rejects(syncCrm(record,"test-key",options(async()=>{calls++;throw new Error("must not call");})),/sender budget.*nothing sent/);
  assert.equal(calls,0);
});
test("oversized priced lines fail rather than disappearing",()=>{
  const record=fixture();record.internal.lines[0].description="priced work ".repeat(12000);
  assert.throws(()=>buildCrmPayload(record,"test-key"),/sender budget/);
});
test("receiver-compatible contact limits fail without truncation",async()=>{
  const record=fixture();record.contact.name="N".repeat(256);
  let calls=0;
  await assert.rejects(syncCrm(record,"key",options(async()=>{calls++;throw new Error("must not call");})),/fullName.*nothing sent/);
  assert.equal(calls,0);
});
test("destination validation precedes network access",async()=>{
  for(const url of ["http://receiver.example.invalid","https://user:password@receiver.example.invalid","not-a-url"]){
    let calls=0;
    await assert.rejects(syncCrm(fixture(),"key",{...options(async()=>{calls++;throw new Error("must not call");}),url}),/credential-free HTTPS/);
    assert.equal(calls,0);
  }
});
test("one HTTPS request rejects redirects and accepts a positive receiver id",async()=>{
  let calls=0;
  const id=await syncCrm(fixture(),"test-key",options(async(url,init)=>{
    calls++;assert.equal(String(url),"https://receiver.example.invalid/api/external/leads");
    assert.equal(init?.redirect,"error");assert.equal(init?.method,"POST");
    assert.equal((init?.headers as Record<string,string>)["Idempotency-Key"],"test-key");
    return Response.json({success:true,leadId:42});
  }));
  assert.equal(id,"42");assert.equal(calls,1);
});
test("status errors, conflicts and invalid acknowledgments remain ambiguous with no retry",async()=>{
  const responses=[
    ()=>Response.json({leadId:42},{status:409}),
    ()=>Response.json({leadId:42},{status:413}),
    ()=>Response.json({leadId:42},{status:500}),
    ()=>Response.json({status:"error",leadId:42}),
    ()=>Response.json({accepted:false,duplicate:true,leadId:42}),
    ()=>Response.json({success:false,leadId:42}),
    ...[undefined,0,-1,true,{},[],"","noop","0","-1"].map(leadId=>()=>Response.json({success:true,leadId})),
    ()=>new Response("not json",{status:200}),
  ];
  for(const make of responses){
    let calls=0;
    await assert.rejects(syncCrm(fixture(),"key",options(async()=>{calls++;return make();})),/unconfirmed/);
    assert.equal(calls,1);
  }
});
test("nested DNS transport codes are actionable without exposing provider secrets",async()=>{
  let calls=0;
  const error=new Error("secret-token https://user:password@private",{cause:new Error("private",{cause:{code:"ENOTFOUND",hostname:"private"}})});
  await assert.rejects(syncCrm(fixture(),"key",options(async()=>{calls++;throw error;})),error=>{
    assert.match((error as Error).message,/ENOTFOUND.*unconfirmed/);
    assert.doesNotMatch((error as Error).message,/secret-token|password|private/);
    return true;
  });
  assert.equal(calls,1);
  assert.equal(crmTransportCode({code:"SECRET-CODE",cause:{code:"ECONNRESET"}}),"ECONNRESET");
  const cyclic:any={message:"private"};cyclic.cause=cyclic;
  assert.equal(crmTransportCode(cyclic),"UNKNOWN_TRANSPORT");
});