/** Browser-reported evidence, never verified Google Ads account/call attribution. */
export const CAMPAIGN_KEYS = ['utm_source','utm_medium','utm_campaign','utm_id','utm_term','utm_content','campaignid','adgroupid','creative','keyword','matchtype','network','device','placement','adposition','gad_source','gad_campaignid'] as const;
export const CLICK_KEYS = ['gclid','gbraid','wbraid','dclid'] as const;
export type ConsentValue = 'granted' | 'denied';
export type AttributionConsent = Record<'analytics_storage'|'ad_storage'|'ad_user_data'|'ad_personalization',ConsentValue>;
export const DENIED_CONSENT: AttributionConsent = {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
export interface AttributionTouch {
  at: string;
  landing: string;
  referrer: string;
  campaign: Record<string,string>;
  clickIds: Record<string,string>;
  evidence: 'google_click_id'|'campaign_parameters'|'referral'|'direct';
}
export interface LeadAttribution {
  version: 1;
  trust: 'browser_reported';
  consent: AttributionConsent;
  first: AttributionTouch;
  latest: AttributionTouch;
}
export const ATTRIBUTION_KEY = 'p5_acquisition_v1';
export const ATTRIBUTION_TTL = 90 * 24 * 60 * 60 * 1000;
const object = (v:unknown):Record<string,unknown> => v && typeof v==='object' && !Array.isArray(v) ? v as Record<string,unknown> : {};
function bounded(v:unknown,max=160):string {
  // Drop likely contact data, HTML/control characters and unresolved ValueTrack templates.
  return typeof v==='string' && v.length<=max && !/[@<>{}\u0000-\u001f]/.test(v) ? v.trim() : '';
}
export function readConsent(raw:unknown):AttributionConsent {
  const value=object(raw);
  return Object.fromEntries(Object.keys(DENIED_CONSENT).map(key=>[key,value[key]==='granted'?'granted':'denied'])) as AttributionConsent;
}
export function attributionUrl(raw:unknown,originOnly=false):string {
  try {
    const u=new URL(String(raw));
    if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return '';
    // Never retain arbitrary URL queries, hashes, credentials or referrer search terms.
    return (u.origin+(originOnly?'':bounded(decodeURIComponent(u.pathname),240))).slice(0,500);
  } catch {return '';}
}
function fields(raw:unknown,keys:readonly string[]):Record<string,string> {
  const value=object(raw);
  return Object.fromEntries(keys.flatMap(key=>{const v=bounded(value[key],CLICK_KEYS.includes(key as typeof CLICK_KEYS[number])?256:160);return v?[[key,v]]:[];}));
}
export function captureTouch(href:string,referrer:string,now=Date.now()):AttributionTouch {
  const url=new URL(href);
  const params=Object.fromEntries(url.searchParams);
  const campaign=fields(params,CAMPAIGN_KEYS),clickIds=fields(params,CLICK_KEYS);
  let external=attributionUrl(referrer,true);
  if(external===url.origin)external='';
  return {at:new Date(now).toISOString(),landing:attributionUrl(href),referrer:external,campaign,clickIds,
    evidence:Object.keys(clickIds).length?'google_click_id':Object.keys(campaign).length?'campaign_parameters':external?'referral':'direct'};
}
function cleanTouch(raw:unknown,consent:AttributionConsent):AttributionTouch|null {
  const value=object(raw),at=typeof value.at==='string'?Date.parse(value.at):NaN;
  if(!Number.isFinite(at)||at>Date.now()+300000)return null;
  const landing=attributionUrl(value.landing);if(!landing)return null;
  const campaign=consent.analytics_storage==='granted'?fields(value.campaign,CAMPAIGN_KEYS):{};
  const clickIds=consent.ad_storage==='granted'&&consent.ad_user_data==='granted'?fields(value.clickIds,CLICK_KEYS):{};
  const referrer=attributionUrl(value.referrer,true);
  return {at:new Date(at).toISOString(),landing,referrer,campaign,clickIds,
    evidence:Object.keys(clickIds).length?'google_click_id':Object.keys(campaign).length?'campaign_parameters':referrer?'referral':'direct'};
}
/** Optional bad metadata must never reject an otherwise valid customer form. */
export function sanitizeAttribution(raw:unknown):LeadAttribution|undefined {
  try {
    const value=object(raw);if(value.version!==1)return;
    const consent=readConsent(value.consent),first=cleanTouch(value.first,consent),latest=cleanTouch(value.latest,consent);
    if(!first||!latest||Date.parse(first.at)>Date.parse(latest.at))return;
    return {version:1,trust:'browser_reported',consent,first,latest};
  } catch {return;}
}
/** Fits the existing CRM note contract; no new HubSpot properties or extra lead writes. */
export function attributionEvidence(raw:unknown):string {
  const value=sanitizeAttribution(raw);
  return value?`Acquisition evidence (browser-reported, not verified call attribution): ${JSON.stringify(value)}`:'';
}
export function appendAttributionEvidence(notes:string,raw:unknown,limit=19900):string {
  const evidence=attributionEvidence(raw);
  // Never displace the existing customer scope to fit optional tracking.
  return evidence&&notes.length+evidence.length+2<=limit?`${notes}\n\n${evidence}`:notes;
}
