import { expect, test, type Page } from "@playwright/test";

/**
 * This fixture intentionally owns every estimator response. Any API request
 * outside the fixture endpoints is aborted, so this suite cannot create a
 * session, send a lead, or contact a real customer.
 */
type FixtureMode = "review" | "long-review" | "clarifications";

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
    summary: "Synthetic project scope",
    facts: [],
    conflicts: [],
    missingInformation: [],
    reviewNotes: [],
    clarifications: [],
    ...(instructions ? { instructions } : {}),
  };
}

async function installFixture(page: Page, mode: FixtureMode = "review") {
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
          service: "handyman",
          taskList: "Repair two interior doors.",
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

  test("is visible on entry and mid-scope, reserves the window scroller, and preserves both gates", async ({ page }) => {
    const { estimator, state } = await openEstimator(page, "long-review");
    await estimator.getByLabel("Tell us about your project", { exact: true }).fill("Repair two interior doors.");
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(estimator.getByRole("heading", { name: "Your project is ready to review", exact: true })).toBeVisible();

    const action = estimator.getByRole("button", { name: "Get my estimate", exact: true });
    await expect(action).toHaveCount(1);
    const metrics = await action.evaluate((button) => {
      const bar = button.parentElement!;
      const checkbox = button.closest("form")?.querySelector('input[type="checkbox"]');
      const barRect = bar.getBoundingClientRect();
      const checkboxRect = checkbox?.getBoundingClientRect();
      const scrollingElement = document.scrollingElement!;
      return {
        position: getComputedStyle(bar).position,
        safeAreaPadding: Number.parseFloat(getComputedStyle(bar).paddingBottom),
        barTop: barRect.top,
        barBottom: barRect.bottom,
        checkboxBottom: checkboxRect?.bottom ?? 0,
        checkboxVisible: Boolean(checkboxRect && checkboxRect.top >= 0 && checkboxRect.bottom <= window.innerHeight),
        viewportBottom: window.innerHeight,
        documentScrollPadding: Number.parseFloat(getComputedStyle(scrollingElement).scrollPaddingBottom),
        rootScrollPadding: Number.parseFloat(getComputedStyle(button.closest("[data-p5-estimator]")!).scrollPaddingBottom),
        rootBottomPadding: Number.parseFloat(getComputedStyle(button.closest("[data-p5-estimator]")!).paddingBottom),
        scrollContainer: scrollingElement.tagName,
        documentHeight: scrollingElement.scrollHeight,
        initialScrollY: window.scrollY,
      };
    });
    expect(metrics.position).toBe("fixed");
    expect(metrics.safeAreaPadding).toBeGreaterThan(0);
    expect(metrics.barTop).toBeGreaterThanOrEqual(-1);
    expect(metrics.barBottom).toBeLessThanOrEqual(metrics.viewportBottom + 1);
    if (metrics.checkboxVisible) expect(metrics.checkboxBottom).toBeLessThanOrEqual(metrics.barTop + 1);
    expect(metrics.documentScrollPadding).toBeGreaterThan(0);
    expect(metrics.rootScrollPadding).toBeGreaterThan(0);
    expect(metrics.rootBottomPadding).toBeGreaterThan(metrics.safeAreaPadding);
    expect(metrics.scrollContainer).toBe("HTML");
    expect(metrics.documentHeight).toBeGreaterThan(metrics.viewportBottom + 200);
    expect(metrics.initialScrollY).toBeLessThanOrEqual(1);

    await page.evaluate(() => window.scrollTo({ top: 480, behavior: "auto" }));
    const midScope = await action.evaluate((button) => {
      const rect = button.parentElement!.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, viewportBottom: window.innerHeight, scrollY: window.scrollY };
    });
    expect(midScope.top).toBeGreaterThanOrEqual(-1);
    expect(midScope.bottom).toBeLessThanOrEqual(midScope.viewportBottom + 1);
    expect(midScope.scrollY).toBeGreaterThan(0);

    await action.click();
    await expect(estimator.getByRole("alert")).toContainText("Please confirm your project details");
    expect(state.submitCalls).toBe(0);

    await estimator.getByRole("checkbox").check();
    await action.click();
    await expect(estimator.getByRole("alert")).toContainText("Enter your name and a valid email address");
    expect(state.submitCalls).toBe(0);

    await estimator.getByLabel("Your name", { exact: true }).fill("Synthetic Test");
    await estimator.getByLabel("Email", { exact: true }).fill("synthetic@example.invalid");
    await action.evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await expect(estimator.getByText("Schedule a scope review.", { exact: true })).toBeVisible();
    expect(state.submitCalls).toBe(1);
  });

  test("moves a focused contact field above a visualViewport keyboard and the action bar", async ({ page }) => {
    const { estimator } = await openEstimator(page, "long-review");
    await estimator.getByLabel("Tell us about your project", { exact: true }).fill("Repair two interior doors.");
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();

    const email = estimator.getByLabel("Email", { exact: true });
    await email.focus();
    await page.evaluate(() => {
      const resize = (window as unknown as { __p5ResizeVisualViewport?: (height: number) => void }).__p5ResizeVisualViewport;
      resize?.(460);
    });
    await expect.poll(async () =>
      page.evaluate(() => {
        const focused = document.activeElement as HTMLElement | null;
        const action = document.querySelector('[data-testid="p5-final-action"]')!;
        const input = document.querySelector('input[type="email"]')!;
        const actionRect = action.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        return {
          focused: focused === input,
          keyboardInsetApplied: action.style.transform.includes("translateY(-"),
          inputTop: inputRect.top,
          inputBottom: inputRect.bottom,
          actionTop: actionRect.top,
          visualBottom: window.visualViewport?.height ?? window.innerHeight,
          inputClearsAction: inputRect.bottom <= actionRect.top + 1,
        };
      }),
    ).toMatchObject({ focused: true, keyboardInsetApplied: true, inputClearsAction: true });

    const geometry = await page.evaluate(() => {
      const actionRect = document.querySelector('[data-testid="p5-final-action"]')!.getBoundingClientRect();
      const inputRect = document.querySelector('input[type="email"]')!.getBoundingClientRect();
      return {
        inputTop: inputRect.top,
        inputBottom: inputRect.bottom,
        actionTop: actionRect.top,
          actionBottom: actionRect.bottom,
        visualBottom: window.visualViewport?.height ?? window.innerHeight,
        scrollY: window.scrollY,
        safeAreaPadding: Number.parseFloat(
          getComputedStyle(document.querySelector('[data-testid="p5-final-action"]')!).paddingBottom,
        ),
      };
    });
    expect(geometry.inputTop).toBeGreaterThanOrEqual(0);
    expect(geometry.inputBottom).toBeLessThanOrEqual(geometry.actionTop + 1);
    expect(geometry.inputBottom).toBeLessThanOrEqual(geometry.visualBottom + 1);
    expect(geometry.actionBottom).toBeLessThanOrEqual(geometry.visualBottom + 1);
    expect(geometry.scrollY).toBeGreaterThan(0);
    expect(geometry.safeAreaPadding).toBeGreaterThan(0);
  });

  test("renders one clarification at a time and clears a reply after scope replacement", async ({ page }) => {
    const { estimator, state } = await openEstimator(page, "clarifications");
    await estimator.getByLabel("Tell us about your project", { exact: true }).fill("Price the door repairs.");
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();

    const question = estimator.getByRole("region", { name: "Project question" });
    await expect(question).toContainText("Labor only or materials only?");
    await expect(question).not.toContainText("Should we confirm permits?");
    await question.getByRole("button", { name: "Labor only", exact: true }).click();
    await question.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(question).toContainText("Should we include painting?");
    await expect(question.getByLabel("Your answer", { exact: true })).toHaveValue("");

    await estimator.getByText("Add or edit project information", { exact: true }).click();
    const projectText = estimator.getByLabel("Tell us about your project", { exact: true });
    await expect(projectText).toHaveCount(1);
    await expect(projectText).toHaveValue("Price the door repairs.");
    await projectText.fill("Replace the door repairs with a new, smaller scope.");
    await estimator.getByRole("button", { name: "Update project", exact: true }).click();
    await expect(question).toContainText("Should we confirm permits?");
    await expect(question.getByLabel("Your answer", { exact: true })).toHaveValue("");
    expect(state.scopeCalls).toBe(2);
    expect(state.draft?.text).not.toContain("Question:");
  });
});

test.describe("P5 estimator desktop final action", () => {
  test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false });

  test("does not pin the final action on desktop", async ({ page }) => {
    const { estimator } = await openEstimator(page, "long-review");
    await estimator.getByLabel("Tell us about your project", { exact: true }).fill("Repair two interior doors.");
    await estimator.getByRole("button", { name: "Continue", exact: true }).click();
    const action = estimator.getByRole("button", { name: "Get my estimate", exact: true });
    await expect(action).toHaveCount(1);
    const position = await action.evaluate((button) => getComputedStyle(button.parentElement!).position);
    expect(position).toBe("static");
  });
});