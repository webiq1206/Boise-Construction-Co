import {ATTRIBUTION_KEY,ATTRIBUTION_TTL,DENIED_CONSENT,captureTouch,readConsent,sanitizeAttribution,type AttributionConsent,type LeadAttribution} from './leadAttribution';
declare global {interface Window {p5Consent?:AttributionConsent; p5ConsentResolved?:boolean; p5UpdateConsent?:(value:Partial<AttributionConsent>)=>void;}}
let state:LeadAttribution|undefined;
let lastHref='';
let restored=false;
function consent(){return readConsent(typeof window==='undefined'?DENIED_CONSENT:window.p5Consent);}
export function captureAttribution():void {
  if(typeof window==='undefined')return;
  const c=consent(),href=window.location.href;
  const currentTouch=captureTouch(href,document.referrer);
  const tagged=Object.keys(currentTouch.campaign).length>0||Object.keys(currentTouch.clickIds).length>0;
  let internalRef=false;
  try{internalRef=new URL(document.referrer).hostname.replace(/^www\./,'')===window.location.hostname.replace(/^www\./,'');}catch{}
  if(!restored&&c.analytics_storage==='granted'){
    restored=true;
    try {
      const saved=sanitizeAttribution(JSON.parse(localStorage.getItem(ATTRIBUTION_KEY)||'null'));
      if(saved&&Date.now()-Date.parse(saved.first.at)<ATTRIBUTION_TTL)state={...saved,latest:state&&(!internalRef||tagged)?state.latest:saved.latest};
      else localStorage.removeItem(ATTRIBUTION_KEY);
    }catch{/* blocked storage is not a form failure */}
  }
  if(href!==lastHref){
    const touch=captureTouch(href,lastHref||document.referrer);
    if(!state)state={version:1,trust:'browser_reported',consent:c,first:touch,latest:touch};
    else if((!lastHref&&!internalRef)||Object.keys(touch.campaign).length||Object.keys(touch.clickIds).length)state={...state,latest:touch};
    lastHref=href;
  }
  if(state)state.consent=c;
  try {
    if(c.analytics_storage==='granted'&&state)localStorage.setItem(ATTRIBUTION_KEY,JSON.stringify(sanitizeAttribution(state)));
    else if(window.p5ConsentResolved)localStorage.removeItem(ATTRIBUTION_KEY);
  }catch{/* in-memory attribution continues for this document */}
}
export function readLeadAttribution():LeadAttribution|undefined {
  captureAttribution();
  return sanitizeAttribution(state);
}
export function handleAttributionConsent():void {
  const c=consent();
  // Revocation removes identifiers from memory as well as storage.
  if(state)state=sanitizeAttribution({...state,consent:c});
  captureAttribution();
}
