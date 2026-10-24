import {test,expect} from '@playwright/test';
import {googleTagBootstrap} from '../lib/analyticsBootstrap';
const consent={analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'denied'};
test.beforeEach(async({page,baseURL})=>{
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin!==new URL(baseURL!).origin)return route.abort();
  if(u.pathname.startsWith('/api/'))return route.fulfill({json:{}});
  return route.continue();
 });
});
test('ad landing, consent, cross-page first/latest evidence and revocation',async({page})=>{
 await page.goto('/?gclid=fixture-click&utm_campaign=homes');
 await page.waitForTimeout(600);
 expect(await page.evaluate(()=>localStorage.getItem('p5_acquisition_v1'))).toBeNull();
 await page.evaluate(c=>(window as any).p5UpdateConsent(c),consent);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('p5_acquisition_v1')||'{}').first?.clickIds?.gclid)).toBe('fixture-click');
 await page.goto('/contact',{referer:page.url()});
 await page.waitForTimeout(1000);
 await page.evaluate(c=>(window as any).p5UpdateConsent(c),consent);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('p5_acquisition_v1')||'{}').latest?.clickIds?.gclid)).toBe('fixture-click');
 await page.goto('/contact?utm_source=newsletter&utm_campaign=followup');
 await page.waitForTimeout(1000); // A delayed CMP must not erase the previously consented first touch.
 await page.evaluate(c=>(window as any).p5UpdateConsent(c),consent);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('p5_acquisition_v1')||'{}').latest?.campaign?.utm_source)).toBe('newsletter');
 const value=await page.evaluate(()=>JSON.parse(localStorage.getItem('p5_acquisition_v1')!));
 expect(value.first.clickIds.gclid).toBe('fixture-click');
 expect(value.latest.clickIds).toEqual({});
 await page.evaluate(()=>(window as any).p5UpdateConsent({analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied'}));
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('p5_acquisition_v1'))).toBeNull();
});
test('organic phone stays normal; Google callback updates links and late DOM without a conversion click',async({page,baseURL})=>{
 await page.goto('/');
 await expect(page.locator('a[href="tel:+12084771169"]').first()).toBeAttached();
 // Isolated Google callback test: network boundary above blocks all vendor requests.
 await page.evaluate(c=>{
  Object.defineProperty(navigator,'webdriver',{get:()=>false,configurable:true});
  (window as any).p5UpdateConsent(c);
 },consent);
 await page.addScriptTag({content:googleTagBootstrap({hostname:new URL(baseURL!).hostname,measurementId:'G-FIXTURE',adsId:'AW-FIXTURE',phoneNumber:'(208) 477-1169',phoneConversionLabel:'CALL'})});
 await page.evaluate(()=>{
  const w=window as any;
  const config=w.dataLayer.find((a:any)=>a[0]==='config'&&a[1]==='AW-FIXTURE/CALL')[2];
  config.phone_conversion_callback('(202) 555-0100','+12025550100');
  const a=document.createElement('a');a.id='late-phone';a.href='tel:+12084771169';a.textContent='(208) 477-1169';document.body.append(a);
 });
 await expect(page.locator('#late-phone')).toHaveAttribute('href','tel:+12025550100');
 await expect(page.locator('#late-phone')).toHaveText('(202) 555-0100');
 expect(await page.evaluate(()=>(window as any).dataLayer.filter((a:any)=>a[0]==='event'&&a[1]==='conversion').length)).toBe(0);
 await page.evaluate(()=>(window as any).p5UpdateConsent({ad_storage:'denied',ad_user_data:'denied'}));
 await expect(page.locator('#late-phone')).toHaveAttribute('href','tel:+12084771169');
 await expect(page.locator('#late-phone')).toHaveText('(208) 477-1169');
});
test('existing contact form carries hidden evidence and emits one accepted conversion',async({page})=>{
 let submissions=0,claims=0,payload:any;
 await page.route('**/api/consultation',async route=>{
  payload=route.request().postDataJSON();submissions++;
  await route.fulfill({json:{accepted:true,inquiryKey:'inq_fixture1234567890123456',conversionId:'conv_fixture1234567890123456',newInquiry:true,conversionEligible:true,delivery:[]}});
 });
 await page.route('**/api/inquiry-conversion',async route=>{
  const body=route.request().postDataJSON();
  if(!body.acknowledge)claims++;
  await route.fulfill({json:{eligible:claims===1,conversionId:body.conversionId}});
 });
 await page.goto('/contact?gclid=fixture-contact&utm_campaign=homes');
 await page.evaluate(c=>(window as any).p5UpdateConsent(c),consent);
 await page.getByTestId('input-name').fill('Synthetic Fixture');
 await page.getByTestId('input-email').fill('fixture@example.invalid');
 await page.getByTestId('select-project-type').click();
 await page.getByRole('option',{name:'Still Looking for Land'}).click();
 await page.getByTestId('button-submit-consultation').click();
 await expect(page.getByTestId('consultation-success')).toBeVisible();
 expect(submissions).toBe(1);
 expect(payload.attribution.first.clickIds.gclid).toBe('fixture-contact');
 await expect.poll(()=>claims).toBe(1);
 await expect.poll(()=>page.evaluate(()=>(window as any).dataLayer.filter((x:any)=>x[0]==='event'&&x[1]==='conversion').length)).toBe(1);
});
