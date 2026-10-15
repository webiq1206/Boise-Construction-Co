import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { googleTagBootstrap } from '../lib/analyticsBootstrap.ts';

const options = { hostname: 'example.com', measurementId: 'G-EXAMPLE', adsId: 'AW-EXAMPLE', phoneConversionLabel: 'PHONE', phoneNumber: '(208) 477-1169' };
function browser(hostname: string, webdriver = false, disabled = false) {
  const nodes: Record<string, unknown>[] = [];
  const storage = new Map(disabled ? [['p5_analytics_disabled', '1']] : []);
  const window = { location: { hostname, pathname: '/quote' }, dataLayer: [['event', 'queued_before_load']], p5Consent:{ad_storage:'granted',ad_user_data:'granted',analytics_storage:'granted'},addEventListener:()=>{} };
  const context = vm.createContext({ window, navigator: { webdriver }, sessionStorage: {
    getItem: (key: string) => storage.get(key), setItem: (key: string, value: string) => storage.set(key, value),
  }, document: { getElementById: (id: string) => nodes.find(n => n.id === id), createElement: () => ({}), head: { appendChild: (n: Record<string, unknown>) => nodes.push(n) } } });
  return { nodes, window, context, storage };
}

test('real apex and www visitors load one tag and preserve conversion configuration', () => {
  for (const host of ['example.com', 'www.example.com']) {
    const b = browser(host);
    vm.runInContext(googleTagBootstrap(options), b.context);
    vm.runInContext(googleTagBootstrap(options), b.context);
    assert.equal(b.nodes.length, 1);
    assert.equal(b.nodes[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-EXAMPLE');
    const queued = b.window.dataLayer.map(args => Array.from(args));
    assert.equal(queued[0][1], 'queued_before_load');
    assert.deepEqual(queued.filter(args => args[0] === 'config').map(args => args[1]), ['G-EXAMPLE', 'AW-EXAMPLE', 'AW-EXAMPLE/PHONE']);
    assert.equal(b.storage.get('p5_entry_path'), '/quote');
  }
});

test('production builds on local, preview, unrelated and deceptive hosts send nothing', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]', 'preview.replit.app', 'other.com', 'example.com.attacker.com']) {
    const b = browser(host);
    vm.runInContext(googleTagBootstrap(options), b.context);
    assert.equal(b.nodes.length, 0, host);
    assert.equal(b.window.dataLayer.length, 1, host);
  }
});

test('automated browsers and explicit QA sessions send nothing even on the live hostname', () => {
  for (const b of [browser('example.com', true), browser('example.com', false, true)]) {
    vm.runInContext(googleTagBootstrap(options), b.context);
    assert.equal(b.nodes.length, 0);
    assert.equal(b.window.dataLayer.length, 1);
  }
});

test('unavailable session storage does not break real visitor analytics', () => {
  const b = browser('example.com');
  vm.runInContext("sessionStorage.getItem = function () { throw new Error('unavailable'); }", b.context);
  vm.runInContext(googleTagBootstrap(options), b.context);
  assert.equal(b.nodes.length, 1);
});


test('campaign capture uses consent-gated attribution storage across navigation', async () => {
  const {captureAttribution,handleAttributionConsent}=await import('../lib/leadAttributionBrowser.ts');
  const {ATTRIBUTION_KEY}=await import('../lib/leadAttribution.ts');
  const g=globalThis as unknown as Record<string,unknown>;
  const names=['window','document','localStorage'];
  const previous=names.map(name=>Object.getOwnPropertyDescriptor(globalThis,name));
  const saved=new Map<string,string>();
  const w={location:new URL('https://example.com/services?gclid=click123&utm_source=google&utm_medium=cpc&email=ignore%40example.com'),p5Consent:{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'},p5ConsentResolved:false};
  try {
    g.window=w;g.document={referrer:''};
    g.localStorage={getItem:(key:string)=>saved.get(key)||null,setItem:(key:string,value:string)=>saved.set(key,value),removeItem:(key:string)=>saved.delete(key)};
    captureAttribution();
    assert.equal(saved.size,0,'pending consent must not persist campaign evidence');
    w.p5Consent={analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'denied'};
    w.p5ConsentResolved=true;handleAttributionConsent();
    const read=()=>JSON.parse(saved.get(ATTRIBUTION_KEY)||'{}');
    assert.equal(read().first.clickIds.gclid,'click123');
    assert.equal(read().first.campaign.utm_source,'google');
    assert.equal(JSON.stringify(read()).includes('ignore'),false);
    w.location=new URL('https://example.com/quote');captureAttribution();
    assert.equal(read().first.clickIds.gclid,'click123');
    assert.equal(read().latest.clickIds.gclid,'click123');
    w.location=new URL('https://example.com/contact?utm_source=newsletter&utm_medium=email');captureAttribution();
    assert.equal(read().first.clickIds.gclid,'click123');
    assert.equal(read().latest.campaign.utm_source,'newsletter');
    assert.equal(read().latest.clickIds.gclid,undefined);
    w.p5Consent={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
    handleAttributionConsent();assert.equal(saved.has(ATTRIBUTION_KEY),false);
  } finally {
    names.forEach((name,i)=>{if(previous[i])Object.defineProperty(globalThis,name,previous[i]!);else delete g[name];});
  }
});
