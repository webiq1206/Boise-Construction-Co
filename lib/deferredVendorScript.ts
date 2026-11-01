/**
 * Third-party tag timing.
 *
 * Two schedules, decided by the owner on 1 November 2026:
 *
 * - Meta Pixel loads fbevents.js at the window load event (loadAtWindowLoad):
 *   no interaction wait and no 5 second wait. Paid-ad landing views matter
 *   more than the small blocking-time saving, and a deferred pixel lost the
 *   Landing Page View of every visitor who left without interacting.
 * - Microsoft Clarity (and any HubSpot tag) stays deferred to the first
 *   interaction or 5 seconds after load (deferVendorLoad).
 *
 * Each vendor's inline stub still runs straight away, so `fbq(...)` and
 * `clarity(...)` calls made before the tag arrives are queued by the vendor's
 * own stub and flushed by the tag when it loads (PageView, Lead, Clarity
 * calls). Only the network request for the vendor file is held back: for a
 * deferred tag until the first pointerdown, keydown, scroll or touchstart, or
 * VENDOR_LOAD_TIMEOUT_MS after the window load event, whichever comes first;
 * for Meta until the window load event.
 */
export const VENDOR_LOAD_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

/** Never less than 5 seconds after load (owner rule). */
export const VENDOR_LOAD_TIMEOUT_MS = 5000;

/** Inline JS that inserts one async script tag for `src`. */
export function vendorScriptTag(src: string): string {
  return `var t=document.createElement('script');t.async=!0;t.src=${JSON.stringify(src)};var s=document.getElementsByTagName('script')[0];if(s&&s.parentNode)s.parentNode.insertBefore(t,s);else document.head.appendChild(t);`;
}

/**
 * Inline JS that runs `load` (a JS statement list) once: on the first
 * interaction event, or VENDOR_LOAD_TIMEOUT_MS after window load.
 */
export function deferVendorLoad(load: string): string {
  return `(function(){var done=!1,ev=${JSON.stringify(VENDOR_LOAD_EVENTS)},o={capture:!0,passive:!0},timer;function go(){if(done)return;done=!0;clearTimeout(timer);for(var i=0;i<ev.length;i++)removeEventListener(ev[i],go,o);${load}}for(var i=0;i<ev.length;i++)addEventListener(ev[i],go,o);function arm(){timer=setTimeout(go,${VENDOR_LOAD_TIMEOUT_MS})}if(document.readyState==='complete')arm();else addEventListener('load',arm,{once:!0});})();`;
}

/**
 * Inline JS that runs `load` (a JS statement list) once at the window load
 * event, or at once when the page has already finished loading. No
 * interaction wait and no timeout: used for the Meta Pixel only.
 */
export function loadAtWindowLoad(load: string): string {
  return `(function(){var done=!1;function go(){if(done)return;done=!0;${load}}if(document.readyState==='complete')go();else addEventListener('load',go,{once:!0});})();`;
}
