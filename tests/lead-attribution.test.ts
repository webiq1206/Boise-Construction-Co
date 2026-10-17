import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {captureTouch,sanitizeAttribution,DENIED_CONSENT,attributionEvidence,appendAttributionEvidence} from '../lib/leadAttribution.ts';
import {consentBootstrap} from '../lib/consentBootstrap.ts';
import {googleTagBootstrap} from '../lib/analyticsBootstrap.ts';
import {intakeProjectReview} from '../lib/p5/intakeProjectReview.ts';
import {intakeDeliveryEnvelope} from '../lib/p5/intakeDeliveryPayload.ts';
import {emptyIntakeDetails,type IntakeSnapshot} from '../lib/p5/intakeContract.ts';
import {routeIntake} from '../lib/p5/intakePolicy.ts';
import {trackGoogleAdsLeadConversion} from '../lib/googleAdsConversion.ts';
import {resolvePropertyProfile} from '../shared/propertyProfile.ts';
const granted={analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'denied'} as const;
const touch=captureTouch('https://boiseconstruction.co/estimate/scope?gclid=fixture-click&utm_campaign=homes&campaignid=123&email=private@example.invalid#secret','https://google.com/search?q=private');
const evidence={version:1,consent:granted,first:touch,latest:touch};
test('ad evidence retains allowed IDs and strips arbitrary URL data',()=>{
 const clean=sanitizeAttribution(evidence)!;
 assert.equal(clean.first.clickIds.gclid,'fixture-click');
 assert.equal(clean.first.campaign.campaignid,'123');
 assert.equal(clean.first.referrer,'https://google.com');
 assert.equal(clean.first.landing,'https://boiseconstruction.co/estimate/scope');
 assert.doesNotMatch(JSON.stringify(clean),/private|secret/);
 assert.equal(clean.trust,'browser_reported');
});
test('unknown or revoked consent never forwards campaign or click identifiers',()=>{
 const clean=sanitizeAttribution({...evidence,consent:DENIED_CONSENT})!;
 assert.deepEqual(clean.first.clickIds,{});
 assert.deepEqual(clean.first.campaign,{});
 assert.equal(clean.first.evidence,'referral');
});
test('organic and direct visitors are not classified as Google Ads',()=>{
 assert.equal(captureTouch('https://boiseconstruction.co/','https://google.com/search').evidence,'referral');
 assert.equal(captureTouch('https://boiseconstruction.co/','').evidence,'direct');
 assert.equal(sanitizeAttribution({bad:true}),undefined);
 assert.equal(attributionEvidence({bad:true}),'');
});
test('optional tracking never displaces existing CRM scope notes',()=>{
 const long='a'.repeat(19900);
 assert.equal(appendAttributionEvidence(long,evidence),long);
 assert.match(appendAttributionEvidence('Original scope',evidence),/^Original scope\n\nAcquisition evidence/);
});
test('acquisition metadata is not a company or customer property address',()=>{
 assert.equal(resolvePropertyProfile({_leadAttribution:evidence} as any),null);
 const property={formattedAddress:'Fixture property',_leadAttribution:evidence};
 assert.equal(resolvePropertyProfile(property as any)?.formattedAddress,'Fixture property');
});
test('consent defaults precede vendor config and standard updates are observed',()=>{
 const events:string[]=[];const window:any={dispatchEvent:(e:any)=>events.push(e.type)};
 vm.runInNewContext(consentBootstrap(),{window,CustomEvent:class{constructor(public type:string){}}});
 assert.equal(window.dataLayer[0][0],'consent');
 assert.equal(window.p5Consent.ad_storage,'granted');
 window.gtag('consent','update',granted);
 assert.equal(window.p5Consent.ad_storage,'granted');
 window.p5UpdateConsent({ad_storage:'denied'});
 assert.equal(window.p5Consent.ad_storage,'denied');
 assert.equal(events.length,3);
});
test('CRM evidence stays in existing strict keyed review contract, not a second lead',()=>{
 const s:IntakeSnapshot={schema:1,projectId:'construction:fixture',draftId:'12345678-1234-4234-8234-123456789abc',originSite:'construction',currentSite:'construction',revision:1,contextVersion:0,savedAt:new Date().toISOString(),
 contact:{name:'Fixture',email:'fixture@example.invalid',phone:'',preferredContact:'email'},details:emptyIntakeDetails(),scope:{text:'Fixture scope',answers:{service:'new-construction'},extraction:null,uploads:[]},routing:routeIntake('construction','new-construction'),unresolved:[],attribution:sanitizeAttribution(evidence)};
 const envelope=intakeDeliveryEnvelope(s,'crm','a'.repeat(64)),p=intakeProjectReview(envelope);
 assert.equal(p.request.details.transcript.length,1);
 assert.match(p.request.details.transcript[0].text,/fixture-click/);
 assert.equal(p.externalLeadId,envelope.leadKey);
 assert.equal(s.details.transcript.length,0,'Customer conversation is untouched');
 assert.deepEqual(intakeProjectReview(envelope),p,'Retry uses identical payload');
});
test('website call config requires consent and uses only Google-issued callback values',()=>{
 const callbacks:Record<string,Function[]>={};const queued:any[]=[];
 const window:any={location:{hostname:'boiseconstruction.co',pathname:'/'},p5Consent:{...DENIED_CONSENT},dataLayer:queued,addEventListener:(n:string,f:Function)=>(callbacks[n]??=[]).push(f)};
 const document={getElementById:()=>null,createElement:()=>({}),head:{appendChild:()=>{}}};
 vm.runInNewContext(googleTagBootstrap({hostname:'boiseconstruction.co',measurementId:'G-TEST',adsId:'AW-TEST',phoneNumber:'(208) 477-1169',phoneConversionLabel:'CALL'}),{window,document,navigator:{},sessionStorage:{getItem:()=>null,setItem:()=>{}}});
 assert.equal(queued.filter(x=>x[1]==='AW-TEST/CALL').length,0);
 window.p5Consent=granted;callbacks['p5:consent'].forEach(f=>f());
 const config=queued.find(x=>x[1]==='AW-TEST/CALL')[2];
 assert.equal(config.phone_conversion_number,'(208) 477-1169');
 assert.equal(typeof config.phone_conversion_callback,'function');
 assert.equal(queued.filter(x=>x[0]==='event'&&x[1]==='conversion').length,0);
});
test('accepted lead conversion ID deduplicates repeated callbacks and sessions',()=>{
 const events:unknown[][]=[];const storage=new Map();
 const prior=(globalThis as any).window;
 (globalThis as any).window={gtag:(...args:unknown[])=>events.push(args),sessionStorage:{getItem:(k:string)=>storage.get(k),setItem:(k:string,v:string)=>storage.set(k,v)}};
 try{
  assert.equal(trackGoogleAdsLeadConversion({},'intake:fixture-attribution'),true);
  assert.equal(trackGoogleAdsLeadConversion({},'intake:fixture-attribution'),false);
  assert.equal(events.length,1);
  assert.equal((events[0][2] as any).transaction_id,'intake:fixture-attribution');
 }finally{(globalThis as any).window=prior;}
});
