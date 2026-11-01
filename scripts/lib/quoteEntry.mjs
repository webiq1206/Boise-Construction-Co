import assert from 'node:assert/strict';

export const retainedEstimatorPath = brand => ['p5','p5-home-co-nextjs','construction','boise-construction-co'].includes(brand) ? '/estimate/scope' : '/estimate';
export const isPublicQuotePath = path => path === '/estimate' || path === '/quote' || path.startsWith('/quote/');

/** Exercise the current public wizard without sending a request. The caller
 * supplies a fresh context with all business/third-party traffic blocked. */
export async function verifyQuoteEntry(page, path) {
  if (path === '/estimate') assert.equal(new URL(page.url()).pathname, '/quote');
  const form = page.locator('form#request-form');
  await form.waitFor();
  await page.waitForFunction(() => ['category','match'].includes(document.querySelector('form#request-form')?.dataset.wizardStep));
  const step = async value => page.waitForFunction(value => document.querySelector('form#request-form')?.dataset.wizardStep === value, value);
  const advance = async value => { await form.getByRole('button', {name:/^(Next|Continue)$/}).click(); await step(value); };
  if (await form.getAttribute('data-wizard-step') === 'category') {
    assert.equal(await form.getByRole('button',{name:'Next',exact:true}).isDisabled(),true);
    await form.getByRole('button',{name:'Repairs or handyman',exact:true}).click();
    await advance('match');
    assert.match(await form.getByRole('status').innerText(), /Boise Handyman Co/);
  } else {
    assert.ok((await form.getByRole('status').innerText()).includes('Co'));
  }
  await advance('note');
  const note = form.getByLabel('What should we know?',{exact:true});
  assert.equal(await form.getByRole('button',{name:'Continue',exact:true}).isDisabled(),true);
  await note.fill('Synthetic navigation check. '+ 'LongUnbrokenMaterialSpecification'.repeat(20));
  await advance('contact');
  assert.equal(await form.getByRole('button',{name:'Next',exact:true}).isDisabled(),true);
  await form.getByLabel('Name',{exact:true}).fill('Synthetic Navigation Check');
  await advance('phone');
  assert.equal(await form.getByRole('button',{name:'Next',exact:true}).isDisabled(),true);
  await form.getByLabel('Phone',{exact:true}).fill('2085550102');
  await advance('email');
  await form.getByLabel('Email',{exact:true}).fill('invalid');
  assert.equal(await form.getByRole('button',{name:'Next',exact:true}).isDisabled(),true);
  await form.getByLabel('Email',{exact:true}).fill('navigation@example.invalid');
  await advance('review');
  assert.match(await form.innerText(), /Synthetic Navigation Check/);
  assert.equal(await form.locator('input[type=file]').count(),1);
  await page.reload(); await step('review');
  assert.match(await form.innerText(), /Synthetic Navigation Check/);
  const send=form.getByRole('button',{name:'Request a quote',exact:true});
  await send.scrollIntoViewIfNeeded();
  assert.ok(await send.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y));}), 'Quote action must be unobstructed');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Quote horizontal overflow');
  // Deliberately stop before submission: no synthetic contact reaches a server.
}

export const isConstruction = brand => ['construction','boise-construction-co'].includes(brand);

/** Public Construction quote form (one screen), separate from the retained typed estimator. */
export async function verifyConstructionEntry(page, path) {
  if(path==='/' || path==='/#calculator'){
    await page.locator('a[href="/estimate"]:visible').first().click();
    await page.waitForURL(url=>url.pathname==='/estimate');
  }
  await fillConstructionQuote(page,'email');
  // Stop before a valid send; caller blocks all external and business requests.
}

const focusedTestId=page=>page.evaluate(()=>document.activeElement?.getAttribute('data-testid'));
const unobstructed=locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y));});

/** One screen: the heading and the first field on arrival, validation in place,
 * "Have us call you" reducing the form, the draft surviving a reload. Never sends. */
export async function fillConstructionQuote(page, method) {
  const form=page.getByTestId('consultation-wizard');
  await form.waitFor();
  assert.equal(await form.getAttribute('data-step'),'project');
  assert.equal(await page.getByTestId('consult-wizard-actions').count(),0,'No Continue: the request is one screen');
  const name=page.getByTestId('input-name');
  assert.ok(await name.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'First field visible on arrival');
  assert.notEqual(await focusedTestId(page),'input-name','No text field is auto-focused on arrival');
  const send=page.getByTestId('button-send-request');
  await send.click();
  assert.equal(await focusedTestId(page),'input-name','Empty send focuses the first error');
  assert.match(await form.innerText(),/Please enter your name/);
  await name.fill('Synthetic Navigation Check');
  await page.getByTestId('textarea-message').fill('Synthetic local-only test. '+'LongUnbrokenMaterialSpecification'.repeat(20));
  await page.getByTestId('button-preferred-contact-'+method).click();
  const field=page.getByTestId('input-'+(method==='email'?'email':'phone'));
  await field.fill(method==='email'?'invalid':'123');
  await send.click();
  assert.equal(await focusedTestId(page),'input-'+(method==='email'?'email':'phone'),'Invalid contact blocks the send');
  await field.fill(method==='email'?'navigation@example.invalid':'2085550102');
  assert.equal(await page.getByTestId('quote-more-detail').evaluate(el=>el.open),false,'Extra detail stays collapsed and optional');
  await page.getByTestId('switch-callback').click();
  assert.equal(await form.getAttribute('data-request-kind'),'callback');
  assert.equal(await page.getByTestId('textarea-message').count(),0,'Callback asks for name and number only');
  assert.equal(await page.getByTestId('select-best-time').count(),1);
  await page.getByTestId('switch-callback').click();
  assert.equal(await form.getAttribute('data-request-kind'),'quote');
  await page.reload();await form.waitFor();
  await page.waitForFunction(()=>document.querySelector('[data-testid="input-name"]')?.value==='Synthetic Navigation Check');
  assert.match(await page.getByTestId('textarea-message').inputValue(),/Synthetic local-only test/);
  for(const link of ['link-quote-call','link-quote-text']) assert.equal(await page.getByTestId(link).count(),1);
  await send.scrollIntoViewIfNeeded();assert.ok(await unobstructed(send),'Quote action must be unobstructed');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Quote horizontal overflow');
}

export async function verifyConstructionRe10Handoff(page) {
  const destination='https://boisehandyman.co/re-10-repairs-boise';
  assert.equal(await page.getByRole('heading',{level:1}).count(),1);
  assert.match(await page.getByRole('heading',{level:1}).innerText(),/RE-10 repairs in Boise/i);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),destination);
  const handoff=page.getByRole('link',{name:'Go to Boise Handyman Co',exact:true});
  assert.equal(await handoff.getAttribute('href'),destination);
  await handoff.scrollIntoViewIfNeeded();
  assert.ok(await handoff.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y));}),'RE-10 handoff must be unobstructed');
  assert.match(await page.locator('body').innerText(),/handled by Boise Handyman Co/);
  assert.equal(await page.locator('[data-p5-estimator]').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // Inspect the exact public destination without visiting a live second brand.
}
