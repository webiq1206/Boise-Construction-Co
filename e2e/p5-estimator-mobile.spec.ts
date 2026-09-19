import { expect, test, type Page } from "@playwright/test";

test.use({serviceWorkers:'block'});

/**
 * This fixture intentionally owns every estimator response. Any API request
 * outside the fixture endpoints is aborted, so this suite cannot create a
 * session, send a lead, or contact a real customer.
 */
type FixtureMode = "review" | "long-review" | "clarifications";
const CONSTRUCTION_SCOPE = "Build a new 2,000 square foot home in Boise with three bedrooms, two bathrooms, standard finishes, and no garage.";
const SMALLER_CONSTRUCTION_SCOPE = "Replace the plan with a smaller 1,600 square foot new home in Boise with three bedrooms, two bathrooms, standard finishes, and no garage.";

function extraction(questions: string[] = [], longReview = false) {
  const instructions =
    questions.length || longReview
      ? {
          inclusions: longReview
            ? Array.from(
                { length: 22 },
                (_, index) =>
                  `Review allowance ${index + 1}: retain the existing conditions, access notes, and installation responsibility in this scope.`,
              )
            : [],
          exclusions: [],
          responsibilities: [],
          buildings: [],
          floors: [],
          separateBuildings: false,
          laborOnly: false,
          materialsOnly: false,
          questions,
        }
      : undefined;
  return {
    summary: "New 2,000 square foot home in Boise with standard finishes and no garage.",
    facts: [
      {field:"service",value:"new-construction",confidence:1,source:"Typed project scope",evidence:"Build a new home",basis:"stated"},
      {field:"sqft",value:"2000",confidence:1,source:"Typed project scope",evidence:"2,000 square foot",basis:"stated"},
    ],
    conflicts: [],
    missingInformation: [],
    reviewNotes: [],
    clarifications: [],
    ...(instructions ? { instructions } : {}),
  };
}

async function installFixture(page: Page, mode: FixtureMode = "review") {
  // Fail closed for analytics, providers, email/CRM and every non-fixture API.
  // The specific fixture route below overrides this route only for local APIs.
  await page.route("**/*", async route => {
    const url=new URL(route.request().url());
    const origin=new URL(test.info().project.use.baseURL as string).origin;
    if(url.origin!==origin||url.pathname.startsWith("/api/"))await route.abort("blockedbyclient");
    else await route.continue();
  });
  await page.addInitScript(() => {
    const events = new EventTarget();
    let height = window.innerHeight;
    const visualViewportMock = {
      get width() {
        return window.innerWidth;
      },
      get height() {
        return height;
      },
      offsetLeft: 0,
      offsetTop: 0,
      scale: 1,
      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        events.addEventListener(type, listener);
      },
      removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        events.removeEventListener(type, listener);
      },
    };
    try {
      Object.defineProperty(window, "visualViewport", {
        configurable: true,
        value: visualViewportMock,
      });
    } catch {
      // Chromium exposes a configurable property; leave native behavior intact
      // if another browser makes it non-configurable.
    }
    (
      window as unknown as {
        __p5ResizeVisualViewport?: (nextHeight: number) => void;
      }
    ).__p5ResizeVisualViewport = (nextHeight: number) => {
      height = nextHeight;
      events.dispatchEvent(new Event("resize"));
    };
  });

  const state = {
    draft: null as Record<string, any> | null,
    scopeCalls: 0,
    submitCalls: 0,
  };

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if(new URL(request.url()).origin!==new URL(test.info().project.use.baseURL as string).origin){await route.abort("blockedbyclient");return;}
    const send = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (path !== "/api/p5-estimator/draft" && path !== "/api/p5-estimator/scope" && path !== "/api/p5-estimator/submit") {
      await route.abort("blockedbyclient");
      return;
    }

    if (path.endsWith("/draft")) {
      if (request.method() === "GET") {
        await send({ draft: state.draft });
        return;
      }

      const input = request.postDataJSON() as Record<string, any>;
      const previous = state.draft;
      const clarification = input.clarification;
      let nextExtraction = previous?.extraction ?? null;
      if (clarification && mode === "clarifications") {
        nextExtraction = extraction(["Should we include painting?"]);
      }
      state.draft = {
        ...(previous ?? {}),
        ...input,
        extraction: nextExtraction,
        answers: {
          ...(input.answers ?? previous?.answers ?? {}),
          ...(clarification ? { estimatingInstructions: "Question: Labor only or materials only?\nAnswer: Labor only" } : {}),
        },
        contact: input.contact ?? previous?.contact ?? { name: "", email: "", phone: "" },
        uploads: previous?.uploads ?? [],
        revision: (previous?.revision ?? 0) + 1,
      };
      await send({ draft: state.draft, conflicts: [], pricedFields: [] });
      return;
    }

    if (path.endsWith("/scope")) {
      state.scopeCalls += 1;
      const questions =
        mode === "clarifications"
          ? state.scopeCalls === 1
            ? ["Labor only or materials only?"]
            : ["Should we confirm permits?"]
          : [];
      state.draft = {
        ...(state.draft ?? {}),
        answers: {
          ...(state.draft?.answers ?? {}),
          service: "new-construction",
          taskList: "Build a complete new home with three bedrooms and two bathrooms.",
          location: "Boise, Idaho",
          sqft: "2000",
          garageIncluded: "no",
          finish: "mid-range",
        },
        extraction: extraction(questions, mode === "long-review"),
        uploads: state.draft?.uploads ?? [],
        revision: (state.draft?.revision ?? 0) + 1,
      };
      await send({
        draft: state.draft,
        conflicts: [],
        pricedFields: [],
        warning: "",
      });
      return;
    }

    state.submitCalls += 1;
    await send({
      accepted: true,
      result: {
        range: { low: 1000, high: 1800 },
        message: "Synthetic planning range.",
        nextStep: "Schedule a scope review.",
        disclaimer: "Synthetic fixture result; not a quote.",
      },
      delivery: [{ channel: "customer", status: "sent" }],
    });
  });

  return state;
}

async function openEstimator(page: Page, mode: FixtureMode = "review") {
  const state = await installFixture(page, mode);
  await page.goto("/estimate/p5-preview");
  const estimator = page.getByRole("region", { name: "Project estimator" });
  await expect(estimator).toBeVisible();
  await expect(estimator.getByLabel("Tell us about your project", { exact: true })).toHaveCount(1);
  await expect(estimator.getByLabel("Upload project files", { exact: true })).toHaveCount(1);
  return { estimator, state };
}

test.describe("P5 estimator mobile final action", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("is visible on entry and mid-scope, reserves the frame scroller, and preserves both gates", async ({ page }) => {
    const { estimator, state } = await openEstimator(page, "long-review");
    await estimator.getByLabel("Tell us about your project", { exact: true }).fill(CONSTRUCTION_SCOPE);
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(estimator.getByRole("heading", { name: "Review your project", exact: true })).toBeVisible();

    const action = estimator.getByRole("button", { name: "Get my estimate", exact: true });
    const name = estimator.getByLabel("Your name", { exact: true });
    const email = estimator.getByLabel("Email", { exact: true });
    await expect(action).toHaveCount(1);
    await action.click();
    await expect(estimator.getByRole("alert")).toContainText("Enter your name and a valid email address");
    expect(state.submitCalls).toBe(0);
    await name.fill("Synthetic Test");
    await email.fill("synthetic@example.invalid");
    const metrics = await action.evaluate((button) => {
      const bar = button.closest("[data-final-action]")!;
      const dock = bar.parentElement!.parentElement!;
      const root = button.closest("[data-p5-estimator]")!;
      const thread = root.querySelector<HTMLElement>("[data-p5-thread]")!;
      const checkbox = button.closest("form")?.querySelector('input[type="checkbox"]');
      const barRect = bar.getBoundingClientRect();
      const dockRect = dock.getBoundingClientRect();
      const checkboxRect = checkbox?.getBoundingClientRect();
      return {
        rootPosition: getComputedStyle(root).position,
        safeAreaPadding: Number.parseFloat(getComputedStyle(dock).paddingBottom),
        barTop: dockRect.top,
        barBottom: dockRect.bottom,
        checkboxBottom: checkboxRect?.bottom ?? 0,
        checkboxVisible: Boolean(checkboxRect && checkboxRect.top >= 0 && checkboxRect.bottom <= window.innerHeight),
        viewportBottom: window.innerHeight,
        scrollOverflow: getComputedStyle(thread).overflowY,
        frameHeight: thread.scrollHeight,
        frameViewport: thread.clientHeight,
        initialScrollTop: thread.scrollTop,
        windowScrollY: window.scrollY,
      };
    });
    expect(metrics.rootPosition).toBe("fixed");
    expect(metrics.safeAreaPadding).toBeGreaterThan(0);
    expect(metrics.barTop).toBeGreaterThanOrEqual(-1);
    expect(metrics.barBottom).toBeLessThanOrEqual(metrics.viewportBottom + 1);
    if (metrics.checkboxVisible) expect(metrics.checkboxBottom).toBeLessThanOrEqual(metrics.barTop + 1);
    expect(metrics.scrollOverflow).toBe("auto");
    expect(metrics.frameHeight).toBeGreaterThan(metrics.frameViewport + 200);
    expect(metrics.initialScrollTop).toBeGreaterThan(0);
    expect(metrics.windowScrollY).toBeLessThanOrEqual(1);

    await estimator.locator("[data-p5-thread]").evaluate((thread: HTMLElement) => thread.scrollTo({ top: 480, behavior: "auto" }));
    const midScope = await action.evaluate((button) => {
      const dock = button.closest("[data-final-action]")!.parentElement!.parentElement!;
      const thread = button.closest("[data-p5-estimator]")!.querySelector<HTMLElement>("[data-p5-thread]")!;
      const rect = dock.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, viewportBottom: window.innerHeight, scrollTop: thread.scrollTop };
    });
    expect(midScope.top).toBeGreaterThanOrEqual(-1);
    expect(midScope.bottom).toBeLessThanOrEqual(midScope.viewportBottom + 1);
    expect(midScope.scrollTop).toBeGreaterThan(0);

    await action.click();
    await expect(estimator.getByRole("alert")).toContainText("Please confirm your project details");
    expect(state.submitCalls).toBe(0);

    await estimator.getByRole("checkbox").check();
    await action.evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await expect(estimator.getByRole("heading", { name: "$1,000 to $1,800", exact: true })).toBeVisible();
    expect(state.submitCalls).toBe(1);
  });

  test("moves a focused contact field above a visualViewport keyboard and the action bar", async ({ page }) => {
    const { estimator } = await openEstimator(page, "long-review");
    await estimator.getByLabel("Tell us about your project", { exact: true }).fill(CONSTRUCTION_SCOPE);
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();

    await estimator.getByLabel("Your name", { exact: true }).fill("Synthetic Test");
    const email = estimator.getByLabel("Email", { exact: true });
    await email.fill("synthetic@example.invalid");
    await email.focus();
    const action = estimator.getByRole("button", { name: "Get my estimate", exact: true });
    await expect(action).toHaveCount(1);
    await page.evaluate(() => {
      const resize = (window as unknown as { __p5ResizeVisualViewport?: (height: number) => void }).__p5ResizeVisualViewport;
      resize?.(460);
    });
    await expect.poll(async () =>
      action.evaluate((button) => {
        const focused = document.activeElement as HTMLElement | null;
        const input = document.querySelector('input[type="email"]')!;
        const actionBar = button.closest("[data-final-action]")!;
        const actionRect = actionBar.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        return {
          focused: focused === input,
          keyboardInsetApplied: Number.parseFloat(getComputedStyle(button.closest("[data-p5-estimator]")!).bottom) > 0,
          inputTop: inputRect.top,
          inputBottom: inputRect.bottom,
          actionTop: actionRect.top,
          visualBottom: window.visualViewport?.height ?? window.innerHeight,
          inputClearsAction: inputRect.bottom <= actionRect.top + 1,
        };
      }),
    ).toMatchObject({ focused: true, keyboardInsetApplied: true, inputClearsAction: true });

    const geometry = await action.evaluate((button) => {
      const actionBar = button.closest("[data-final-action]")!;
      const actionRect = actionBar.getBoundingClientRect();
      const inputRect = document.querySelector('input[type="email"]')!.getBoundingClientRect();
      return {
        inputTop: inputRect.top,
        inputBottom: inputRect.bottom,
        actionTop: actionRect.top,
          actionBottom: actionRect.bottom,
        visualBottom: window.visualViewport?.height ?? window.innerHeight,
        scrollTop: button.closest("[data-p5-estimator]")!.querySelector<HTMLElement>("[data-p5-thread]")!.scrollTop,
        safeAreaPadding: Number.parseFloat(getComputedStyle(actionBar.parentElement!.parentElement!).paddingBottom),
      };
    });
    expect(geometry.inputTop).toBeGreaterThanOrEqual(0);
    expect(geometry.inputBottom).toBeLessThanOrEqual(geometry.actionTop + 1);
    expect(geometry.inputBottom).toBeLessThanOrEqual(geometry.visualBottom + 1);
    expect(geometry.actionBottom).toBeLessThanOrEqual(geometry.visualBottom + 1);
    expect(geometry.scrollTop).toBeGreaterThan(0);
    expect(geometry.safeAreaPadding).toBeGreaterThan(0);
  });

  test("renders one clarification at a time and clears a reply after scope replacement", async ({ page }) => {
    const { estimator, state } = await openEstimator(page, "clarifications");
    await estimator.getByLabel("Tell us about your project", { exact: true }).fill(CONSTRUCTION_SCOPE);
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();

    const question = estimator.getByRole("region", { name: "Project question" });
    await expect(question).toContainText("Labor only or materials only?");
    await expect(question).not.toContainText("Should we confirm permits?");
    await question.getByRole("button", { name: "Please include labor only", exact: true }).click();
    await estimator.getByRole("button", { name: "Send answer", exact: true }).click();
    await expect(question).toContainText("Should we include painting?");
    await expect(estimator.getByLabel("Your answer", { exact: true })).toHaveValue("");

    await estimator.getByRole("button", { name: "Back to the previous step", exact: true }).click();
    const projectText = estimator.getByLabel("Tell us about your project", { exact: true });
    await expect(projectText).toHaveCount(1);
    await expect(projectText).toHaveValue(new RegExp(CONSTRUCTION_SCOPE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await projectText.fill(SMALLER_CONSTRUCTION_SCOPE);
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(question).toContainText("Should we confirm permits?");
    await expect(estimator.getByLabel("Your answer", { exact: true })).toHaveValue("");
    expect(state.scopeCalls).toBe(2);
    expect(state.draft?.text).not.toContain("Question:");
  });
});

for(const width of [390,1280]){
  test.describe(`P5 isolated mixed-file recovery at ${width}px`,()=>{
    test.use({viewport:{width,height:900},serviceWorkers:'block'});
    test('reload keeps all pending PDF/photo/XLSX bytes and partial manual answers',async({page})=>{
      const {estimator,state}=await openEstimator(page);
      const text='Build a new 2,000 square foot home in Boise. Retain specified fixtures, exclude landscaping, and resolve plan versus spreadsheet quantities.';
      await estimator.getByLabel('Tell us about your project',{exact:true}).fill(text);
      const fixtures=[
        {name:'250-page-plan.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF fixture with all 250 page references '+Array.from({length:250},(_,i)=>`page-${i+1}`).join('\n'))},
        {name:'site.jpg',mimeType:'image/jpeg',buffer:Buffer.from('synthetic photo bytes')},
        {name:'scope.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('synthetic spreadsheet bytes with exclusion and quantities')},
      ];
      await estimator.getByLabel('Upload project files',{exact:true}).setInputFiles(fixtures);
      await expect(estimator.getByRole('button',{name:'Continue',exact:true})).toBeEnabled();
      await expect(estimator.getByRole('list',{name:'Project files',exact:true})).toContainText('scope.xlsx');
      const before=await page.evaluate(()=>{
        const draft=JSON.parse(localStorage.getItem('p5-project-draft-v2')!);
        draft.answers={...draft.answers,sqft:'1,'};
        draft.pendingReply={id:'manual-fixture-question',answer:'Owner supplies all Bosch fixtures; retain exclusions.'};
        draft.dirty=true;
        localStorage.setItem('p5-project-draft-v2',JSON.stringify(draft));return draft;
      });
      await page.reload();
      await expect(estimator.getByRole('button',{name:'Continue',exact:true})).toBeEnabled();
      await expect(estimator.getByLabel('Tell us about your project',{exact:true})).toHaveValue(text);
      for(const file of fixtures)await expect(estimator.getByRole('list',{name:'Project files',exact:true})).toContainText(file.name);
      const recovered=await page.evaluate(async()=>{
        const draft=JSON.parse(localStorage.getItem('p5-project-draft-v2')!);
        const files=await new Promise<Array<{name:string;bytes:number[]}>>((resolve,reject)=>{
          const open=indexedDB.open('p5-project-files-v1',1);
          open.onerror=()=>reject(open.error);
          open.onsuccess=()=>{
            const db=open.result;const tx=db.transaction('files','readonly');const read=tx.objectStore('files').getAll();
            read.onsuccess=()=>resolve(read.result.filter(f=>f.draftId===draft.id).map(f=>({name:f.name,bytes:Array.from(new Uint8Array(f.bytes))})));
            read.onerror=()=>reject(read.error);tx.oncomplete=()=>db.close();
          };
        });return {draft,files};
      });
      expect(recovered.draft.id).toBe(before.id);
      expect(recovered.draft.answers).toEqual(before.answers);
      expect(recovered.draft.pendingReply).toEqual(before.pendingReply);
      expect(recovered.files).toHaveLength(3);
      for(const file of fixtures)expect(recovered.files.find(f=>f.name===file.name)?.bytes).toEqual(Array.from(file.buffer));
      expect(state.scopeCalls).toBe(0);expect(state.submitCalls).toBe(0);
    });
    test('quota failure survives reload as a reselection requirement before analysis',async({page})=>{
      await page.addInitScript(()=>{
        const put=IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put=function(value:any,key?:IDBValidKey){
          if(sessionStorage.getItem('fixture-quota-failure')==='true'&&String(value?.id).startsWith('staging:'))throw new DOMException('Fixture quota exhausted','QuotaExceededError');
          return key===undefined?put.call(this,value):put.call(this,value,key);
        };
      });
      const {estimator,state}=await openEstimator(page);
      await page.evaluate(()=>sessionStorage.setItem('fixture-quota-failure','true'));
      await estimator.getByLabel('Tell us about your project',{exact:true}).fill('Retain every plan, photo and spreadsheet exclusion.');
      const file={name:'plan.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF fixture retained original')};
      await estimator.getByLabel('Upload project files',{exact:true}).setInputFiles([file]);
      await expect(estimator.getByRole('button',{name:'Continue',exact:true})).toBeEnabled();
      await expect(estimator).toContainText('Device storage may be full or unavailable');
      await page.reload();
      await expect(estimator).toContainText('Select the original files again before continuing: plan.pdf');
      await estimator.getByRole('button',{name:'Continue',exact:true}).click();
      await expect(estimator).toContainText('matching uploaded segments will resume');
      expect(state.scopeCalls).toBe(0);expect(state.draft).toBeNull();expect(state.submitCalls).toBe(0);
      await page.evaluate(()=>sessionStorage.setItem('fixture-quota-failure','false'));
      await estimator.getByLabel('Upload project files',{exact:true}).setInputFiles([file]);
      await expect(estimator).toContainText('Files saved on this device');
      await page.reload();
      await expect(estimator.getByRole('button',{name:'Continue',exact:true})).toBeEnabled();
      await expect(estimator.getByRole('list',{name:'Project files',exact:true})).toContainText('plan.pdf');
      await expect(estimator).not.toContainText('Select the original files again before continuing');
      expect(state.scopeCalls).toBe(0);
    });
    test('typed clarification and saved mixed upload receipts survive reload together',async({page})=>{
      const {estimator,state}=await openEstimator(page,'clarifications');
      await estimator.getByLabel('Tell us about your project',{exact:true}).fill('Build a new 2,000 square foot home in Boise; labor only, owner supplies specified materials.');
      await estimator.getByRole('button',{name:'Continue',exact:true}).click();
      const question=estimator.getByRole('region',{name:'Project question'});
      await expect(question).toContainText('Labor only or materials only?');
      const reply='Labor only. Exclude painting and retain the Bosch specifications.';
      await estimator.getByLabel('Your answer',{exact:true}).fill(reply);
      const uploads=['plan.pdf','photo.jpg','scope.xlsx'].map((name,index)=>({id:`fixture-${index}`,name,type:'fixture',size:index+10,sha256:String(index).repeat(64),status:'stored'}));
      state.draft!.uploads=uploads;
      await page.evaluate(uploads=>{
        const draft=JSON.parse(localStorage.getItem('p5-project-draft-v2')!);draft.uploads=uploads;
        localStorage.setItem('p5-project-draft-v2',JSON.stringify(draft));
      },uploads);
      await page.reload();
      await expect(question).toContainText('Labor only or materials only?');
      await expect(estimator.getByLabel('Your answer',{exact:true})).toHaveValue(reply);
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('p5-project-draft-v2')!));
      expect(saved.uploads).toEqual(uploads);
      expect(saved.text).toBe('Build a new 2,000 square foot home in Boise; labor only, owner supplies specified materials.');
      expect(state.scopeCalls).toBe(1);expect(state.submitCalls).toBe(0);
    });
  });
}

test.describe("P5 estimator desktop final action", () => {
  test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false });

  test("does not pin the final action on desktop", async ({ page }) => {
    const { estimator } = await openEstimator(page, "long-review");
    await estimator.getByLabel("Tell us about your project", { exact: true }).fill(CONSTRUCTION_SCOPE);
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();
    await estimator.getByLabel("Your name", { exact: true }).fill("Synthetic Test");
    await estimator.getByLabel("Email", { exact: true }).fill("synthetic@example.invalid");
    const action = estimator.getByRole("button", { name: "Get my estimate", exact: true });
    await expect(action).toHaveCount(1);
    const position = await action.evaluate((button) => getComputedStyle(button.parentElement!).position);
    expect(position).toBe("static");
  });
});