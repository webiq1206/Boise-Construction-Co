/**
 * Browser-level regression tests for the new-construction estimator.
 *
 * The estimator is a guided wizard: one step on screen at a time, a progress
 * bar, sticky Back/Continue, a review screen, then a contact gate, and only
 * after a successful lead POST the results. These tests drive it the way a
 * visitor does - taps and Continue - rather than assuming every section is on
 * the page at once.
 *
 * THE GATE IS THE INVARIANT. No price may render anywhere before the contact
 * form has POSTed successfully to /api/estimate-lead: not on the question
 * steps, not on the review screen, not in the contact step, and not after a
 * failed submission. A 4xx OR a 5xx keeps the gate shut with everything the
 * visitor entered preserved (5xx used to reveal; the wizard now offers Retry
 * instead, so a lead is never lost silently).
 */
import { expect, test, type Page } from "@playwright/test";

/**
 * The three project cards the public estimator offers. "Build on My Lot" is no
 * longer a card: land ownership is asked as its own early question, and a
 * landowner's Custom Home is priced internally as build-on-your-lot.
 */
const PUBLIC_PROJECTS = [
  "custom-home",
  "semi-custom-home",
  "shop-home",
] as const;

/** Retired from the public calculator; must not reappear as cards. */
const REMODEL_PROJECTS = ["kitchen", "bathroom", "whole-home", "basement"] as const;

/** The four planning stages, the estimator's first question. */
const PLANNING_STAGES = [
  "have-plans",
  "plans-in-progress",
  "need-plans",
  "exploring",
] as const;

async function openCalculator(page: Page) {
  await page.goto("/#calculator");
  await page.locator("#calculator").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("wizard-progress")).toBeVisible();
  /* The server HTML shows the wizard before React attaches handlers; a click
     in that gap silently does nothing. data-hydrated appears with the first
     client effect, so waiting for it makes the first tap real. */
  await expect(page.locator("#calculator [data-hydrated]")).toHaveCount(1, { timeout: 20_000 });
}

/** The sticky Continue button - the one navigation control every step shares. */
function continueBtn(page: Page) {
  return page.getByTestId("wizard-continue");
}

/**
 * Advance the wizard one action at a time until the review screen. Handles
 * every conditional step by looking at what is actually on screen, so the same
 * helper works for every project and land-ownership path.
 */
async function driveToReview(
  page: Page,
  {
    project = "custom-home",
    stage = "have-plans",
    ownership = "not-yet",
  }: { project?: string; stage?: string; ownership?: "own" | "not-yet" } = {},
) {
  for (let i = 0; i < 25; i++) {
    // Review reached: every drive ends here.
    if (await page.locator('[data-testid="review-stage"]:visible').count()) return;

    if (await page.locator(`[data-testid="calc-stage-${stage}"]:visible`).count()) {
      await page.getByTestId(`calc-stage-${stage}`).click();
    } else if (await page.locator(`[data-testid="calc-land-${ownership}"]:visible`).count()) {
      await page.getByTestId(`calc-land-${ownership}`).click();
    } else if (await page.locator(`[data-testid="calc-tab-${project}"]:visible`).count()) {
      await page.getByTestId(`calc-tab-${project}`).click();
    } else if (await page.locator('[data-testid^="calc-subtype-"]:visible').count()) {
      const already = await page
        .locator('[data-testid^="calc-subtype-"][aria-pressed="true"]:visible')
        .count();
      if (already) await continueBtn(page).click();
      else await page.locator('[data-testid^="calc-subtype-"]:visible').first().click();
    } else if (await page.locator('[data-testid^="calc-baths-"]:visible').count()) {
      const already = await page
        .locator('[data-testid^="calc-baths-"][aria-pressed="true"]:visible')
        .count();
      if (already) await continueBtn(page).click();
      else await page.locator('[data-testid^="calc-baths-"]:visible').first().click();
    } else if (await page.locator('[data-testid="calc-kitchen-yes"]:visible').count()) {
      await page.getByTestId("calc-kitchen-yes").click();
    } else if (await page.locator('[data-testid="calc-finish-mid-range"]:visible').count()) {
      const already = await page
        .locator('[data-testid="calc-finish-mid-range"][aria-pressed="true"]')
        .count();
      if (!already) await page.getByTestId("calc-finish-mid-range").click();
      await continueBtn(page).click();
    } else if (await continueBtn(page).isEnabled()) {
      // Optional steps (plans, location, size, site, options, structures).
      await continueBtn(page).click();
    }
    // Auto-advance steps need a beat before the next step renders.
    await page.waitForTimeout(500);
  }
  throw new Error("driveToReview: never reached the review step");
}

/** From review, open the contact step and submit the lead. */
async function submitGate(page: Page) {
  await continueBtn(page).click(); // review -> contact
  await expect(page.getByTestId("gate-input-name")).toBeVisible();

  await page.getByTestId("gate-input-name").fill("Test Homeowner");
  await page.getByTestId("gate-input-email").fill("test.homeowner@example.com");
  await page.getByTestId("gate-input-phone").fill("2085550147");
  const address = page.locator('[data-testid="gate-input-address"]:visible');
  if (await address.count()) await address.fill("1234 W Test St, Boise, ID 83702");
  const area = page.locator('[data-testid="gate-input-build-area"]:visible');
  if (await area.count()) await area.fill("Meridian");

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/api/estimate-lead") && res.request().method() === "POST",
  );
  await continueBtn(page).click();
  return responsePromise;
}

test.describe("New construction estimator wizard", () => {
  test("opens on planning stage with a progress bar, and shows no price or draft", async ({ page }) => {
    await openCalculator(page);

    // Question one is present, unanswered, and is the ONLY question on offer.
    for (const stage of PLANNING_STAGES) {
      await expect(page.getByTestId(`calc-stage-${stage}`)).toBeVisible();
    }
    await expect(page.locator('[data-testid^="calc-stage-"][aria-checked="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="calc-tab-"]')).toHaveCount(0);
    await expect(page.getByTestId("wizard-progress")).toContainText("1");

    // No price is shown, and nothing is persisted, before the visitor chooses.
    await expect(page.locator('[data-testid="estimate-range"]')).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("brc_estimate"))).toBeNull();
  });

  test("asks land ownership after the stage, then offers only public project cards", async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId("calc-stage-need-plans").click();

    // The land question arrives on its own step; the project grid waits.
    await expect(page.getByTestId("calc-land-own")).toBeVisible();
    await expect(page.locator('[data-testid^="calc-tab-"]')).toHaveCount(0);

    await page.getByTestId("calc-land-not-yet").click();
    for (const project of PUBLIC_PROJECTS) {
      await expect(page.getByTestId(`calc-tab-${project}`)).toBeVisible();
    }
    for (const project of REMODEL_PROJECTS) {
      await expect(page.getByTestId(`calc-tab-${project}`)).toHaveCount(0);
    }
    await expect(page.getByTestId("calc-tab-build-on-your-lot")).toHaveCount(0);

    // Nothing is preselected.
    await expect(page.locator('[data-testid^="calc-tab-"][aria-selected="true"]')).toHaveCount(0);
  });

  test("one step at a time: later questions are not in the DOM early, and Back preserves answers", async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId("calc-stage-need-plans").click();
    await expect(page.getByTestId("calc-land-own")).toBeVisible();

    // Only the current step renders: no layout cards, no slider, no finish.
    await expect(page.locator('[data-testid^="calc-subtype-"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="calc-sqft-slider"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="calc-finish-mid-range"]')).toHaveCount(0);

    await page.getByTestId("calc-land-not-yet").click();
    await page.getByTestId("calc-tab-custom-home").click();
    // Wait for the auto-advance to land on the location step before going Back.
    await expect(page.locator('[data-testid="early-input-build-area"]:visible')).toBeVisible();

    // Back from the location step returns to the project step with the choice kept.
    await page.getByTestId("wizard-back").click();
    await expect(
      page.locator('[data-testid="calc-tab-custom-home"][aria-selected="true"]'),
    ).toBeVisible();
  });

  test("square footage is settable on the size step", async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId("calc-stage-need-plans").click();
    await expect(page.getByTestId("calc-land-not-yet")).toBeVisible();
    await page.getByTestId("calc-land-not-yet").click();
    await expect(page.getByTestId("calc-tab-custom-home")).toBeVisible();
    await page.getByTestId("calc-tab-custom-home").click();
    await expect(page.locator('[data-testid="early-input-build-area"]:visible')).toBeVisible();
    await continueBtn(page).click(); // location -> layout
    await page.locator('[data-testid^="calc-subtype-"]:visible').first().click();

    const slider = page.locator('[data-testid="calc-sqft-slider"]:visible');
    await expect(slider).toBeVisible();
    const value = page.locator('[data-testid="calc-sqft-value"]:visible');
    const initial = await value.textContent();
    expect(initial).toBeTruthy();

    const max = await slider.getAttribute("max");
    await slider.fill(String(max));
    await expect(value).not.toHaveText(initial!);
    await expect(value).toContainText(Number(max).toLocaleString());
  });

  test("switching project swaps in that project's own layout options", async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId("calc-stage-need-plans").click();
    await expect(page.getByTestId("calc-land-not-yet")).toBeVisible();
    await page.getByTestId("calc-land-not-yet").click();
    await expect(page.getByTestId("calc-tab-custom-home")).toBeVisible();

    await page.getByTestId("calc-tab-custom-home").click();
    await expect(page.locator('[data-testid="early-input-build-area"]:visible')).toBeVisible();
    await continueBtn(page).click(); // location -> layout
    await expect(page.locator('[data-testid^="calc-subtype-"]:visible').first()).toBeVisible();
    const customSubtypes = await page
      .locator('[data-testid^="calc-subtype-"]:visible')
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));

    // Back to the location step, then to the project step, and switch.
    await page.getByTestId("wizard-back").click();
    await expect(page.locator('[data-testid="early-input-build-area"]:visible')).toBeVisible();
    await page.getByTestId("wizard-back").click();
    await expect(page.getByTestId("calc-tab-shop-home")).toBeVisible();
    await page.getByTestId("calc-tab-shop-home").click();
    await expect(page.getByTestId("calc-tab-shop-home")).toHaveAttribute("aria-selected", "true");
    // The tap auto-advances to the location step on its own.
    await expect(page.locator('[data-testid="early-input-build-area"]:visible')).toBeVisible();
    await continueBtn(page).click(); // location -> layout
    await expect(page.locator('[data-testid^="calc-subtype-"]:visible').first()).toBeVisible();
    const shopSubtypes = await page
      .locator('[data-testid^="calc-subtype-"]:visible')
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));

    expect(shopSubtypes.length).toBeGreaterThan(0);
    expect(shopSubtypes).not.toEqual(customSubtypes);
  });
});

/**
 * The stored estimate is what both emails and the CRM record are built from.
 * Written only once every required answer exists (allChosen), whatever step is
 * on screen. Polled: the write happens from an effect.
 */
async function storedEstimate(
  page: Page,
  want: (e: any) => boolean = (e) => Boolean(e),
) {
  const read = () =>
    page.evaluate(() => {
      const raw = sessionStorage.getItem("brc_estimate");
      return raw ? JSON.parse(raw) : null;
    });

  await expect.poll(async () => want(await read()), { timeout: 15_000 }).toBe(true);
  return read();
}

async function clearStoredEstimate(page: Page) {
  await page.evaluate(() => {
    sessionStorage.removeItem("brc_estimate");
    sessionStorage.removeItem("brc_estimate_wizard_v1");
  });
}

test.describe("Accessory structures", () => {
  /**
   * A control that changes no number is worse than no control. Both the
   * structure and its follow-ups must move the range. Edited from the review
   * screen, exactly as a visitor reconsidering their scope would.
   */
  test("ticking a shop raises the range, and heating it raises it again", async ({ page }) => {
    await openCalculator(page);
    await driveToReview(page);

    const before = await storedEstimate(
      page,
      (e) => e?.refinements?.accessoryStructures?.length === 0,
    );

    await page.getByTestId("review-structures-edit").click();
    await expect(page.getByTestId("calc-structure-shop")).toBeVisible();
    await page.getByTestId("calc-structure-shop").click();
    const withShop = await storedEstimate(
      page,
      (e) => e?.refinements?.accessoryStructures?.length === 1,
    );
    expect(withShop.priceLow).toBeGreaterThan(before.priceLow);

    await page.getByTestId("calc-structure-heated-shop").click();
    const heated = await storedEstimate(
      page,
      (e) => e?.refinements?.accessoryStructures?.[0]?.heated === true,
    );
    expect(heated.priceLow).toBeGreaterThan(withShop.priceLow);

    // Saving returns straight to review - answers intact.
    await continueBtn(page).click();
    await expect(page.getByTestId("review-structures")).toContainText("Shop");
  });

  test("the shop chip is not offered on a shop home", async ({ page }) => {
    await openCalculator(page);
    await driveToReview(page, { project: "shop-home" });
    await page.getByTestId("review-structures-edit").click();
    await expect(page.locator('[data-testid="calc-structure-shop"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="calc-structure-barn"]:visible')).toBeVisible();
  });
});

test.describe("Plan upload", () => {
  /** Offered only to the two stages that have drawings to give. */
  test("is offered to visitors with plans and withheld from those without", async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId("calc-stage-have-plans").click();
    await expect(page.locator('[data-testid="calc-plan-upload"]')).toHaveCount(1);

    await openCalculator(page);
    await clearStoredEstimate(page);
    await page.reload();
    await expect(page.getByTestId("wizard-progress")).toBeVisible();
    await expect(page.locator("#calculator [data-hydrated]")).toHaveCount(1, { timeout: 20_000 });
    await page.getByTestId("calc-stage-exploring").click();
    // The next step for a visitor without drawings is land, not upload.
    await expect(page.getByTestId("calc-land-own")).toBeVisible();
    await expect(page.locator('[data-testid="calc-plan-upload"]')).toHaveCount(0);
  });
});

test.describe("Review and gate", () => {
  test("review confirms the answers but never the price", async ({ page }) => {
    await openCalculator(page);
    await driveToReview(page);

    await expect(page.getByTestId("review-project")).toContainText("Custom");
    await expect(page.getByTestId("review-finish")).toBeVisible();

    // THE INVARIANT: no dollar figure anywhere before the gate is passed.
    const calculatorText = await page.locator("#calculator").innerText();
    expect(calculatorText).not.toMatch(/\$[\d,]{3,}/);
    await expect(page.locator('[data-testid="estimate-range"]')).toHaveCount(0);
  });

  test("editing from review returns to review with every other answer intact", async ({ page }) => {
    await openCalculator(page);
    await driveToReview(page);

    await page.getByTestId("review-size-edit").click();
    const slider = page.locator('[data-testid="calc-sqft-slider"]:visible');
    await expect(slider).toBeVisible();
    const max = await slider.getAttribute("max");
    await slider.fill(String(max));
    await continueBtn(page).click();

    await expect(page.getByTestId("review-size")).toContainText(Number(max).toLocaleString());
    await expect(page.getByTestId("review-project")).toBeVisible();
  });

  test("a refresh mid-flow restores the answers and the step", async ({ page }) => {
    await openCalculator(page);
    await driveToReview(page);

    await page.reload();
    // The wizard restores from its saved draft once hydrated.
    await expect(page.getByTestId("review-stage")).toBeVisible({ timeout: 20_000 });
    const calculatorText = await page.locator("#calculator").innerText();
    expect(calculatorText).not.toMatch(/\$[\d,]{3,}/);
  });
});

test.describe("Client and server agree on the price", () => {
  /**
   * The estimate is computed in the browser and RECOMPUTED on the server,
   * which then wins: it is what goes into both emails and the CRM. This
   * drives a structure that materially moves the price and checks the
   * server's recomputation against the client's stored figure.
   */
  test("a shop survives the round trip to the lead route", async ({ page }) => {
    await openCalculator(page);
    await driveToReview(page);

    await page.getByTestId("review-structures-edit").click();
    await page.getByTestId("calc-structure-shop").click();
    const local = await storedEstimate(
      page,
      (e) => e?.refinements?.accessoryStructures?.length === 1,
    );
    await continueBtn(page).click(); // back to review

    const response = await submitGate(page);
    expect(response.status()).toBeLessThan(400);

    const body = await response.json().catch(() => null);
    const serverLow = body?.estimate?.priceLow ?? body?.priceLow;
    if (typeof serverLow === "number") {
      expect(
        Math.abs(serverLow - local.priceLow),
        `server recomputed ${serverLow} against the client's ${local.priceLow}; a priced field is being stripped by the wire schema`,
      ).toBeLessThan(1000);
    }
  });
});

test.describe("Planning stage", () => {
  /** Completed drawings earn a tighter band than idle curiosity. */
  test("a visitor with plans is quoted a narrower band than one still exploring", async ({ page }) => {
    await openCalculator(page);
    await driveToReview(page, { stage: "have-plans" });
    const withPlans = await storedEstimate(
      page,
      (e) => e?.refinements?.planningStage === "have-plans",
    );

    await openCalculator(page);
    await clearStoredEstimate(page);
    await page.reload();
    await expect(page.getByTestId("wizard-progress")).toBeVisible();
    await expect(page.locator("#calculator [data-hydrated]")).toHaveCount(1, { timeout: 20_000 });
    await driveToReview(page, { stage: "exploring" });
    const exploring = await storedEstimate(
      page,
      (e) => e?.refinements?.planningStage === "exploring",
    );

    const width = (e: { priceLow: number; priceHigh: number }) =>
      (e.priceHigh - e.priceLow) / (e.priceHigh + e.priceLow);

    expect(width(withPlans)).toBeLessThan(width(exploring));
  });
});

test.describe("Land ownership", () => {
  /**
   * A landowner's Custom Home IS the old Build on My Lot: same lot-type layout
   * cards, same pricing rules. If this drifts, owners are silently quoted a
   * spec-lot number for a bare-lot build.
   */
  test("owning land turns Custom Home into the lot-owned path", async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId("calc-stage-need-plans").click();
    await page.getByTestId("calc-land-own").click();
    await page.getByTestId("calc-tab-custom-home").click();
    // Owners get the street-address lookup on the location step.
    await expect(page.locator('[data-testid="early-input-address"]:visible')).toBeVisible();
    await continueBtn(page).click(); // location -> layout

    // The layout cards describe the LOT, not the house.
    await expect(page.locator('[data-testid="calc-subtype-valley-flat"]:visible')).toBeVisible();

    await driveToReview(page, { ownership: "own" });

    // The well/septic chip is gone on owned-land paths: the site questions are
    // the authority on water and sewer.
    await page.getByTestId("review-options-edit").click();
    await expect(page.locator('[data-testid="calc-chip-well-septic"]')).toHaveCount(0);
    await continueBtn(page).click();

    const estimate = await storedEstimate(page, (e) => Boolean(e?.project));
    expect(estimate.project).toBe("build-on-your-lot");
  });

  test("flipping ownership away swaps the address step for a build-area question", async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId("calc-stage-need-plans").click();
    await page.getByTestId("calc-land-own").click();
    await page.getByTestId("calc-tab-custom-home").click();
    await expect(page.locator('[data-testid="early-input-address"]:visible')).toBeVisible();

    // Back to the land step and change the answer.
    await page.getByTestId("wizard-back").click();
    await page.getByTestId("wizard-back").click();
    await expect(page.getByTestId("calc-land-own")).toBeVisible();
    await page.getByTestId("calc-land-not-yet").click();
    // The project re-resolves; continue to the location slot, now a build-area question.
    await expect(page.locator('[data-testid^="calc-tab-"]:visible').first()).toBeVisible();
    await continueBtn(page).click();
    await expect(page.locator('[data-testid="early-input-build-area"]:visible')).toBeVisible();
  });
});

test.describe("Mobile layout", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  /**
   * The sticky Back/Continue bar is the wizard's one navigation control, so on
   * a phone it must be pinned inside the viewport while a step taller than the
   * screen is being answered - not resting below the fold. This regressed once
   * already: overflow-hidden on the estimator section silently un-sticks every
   * descendant, which is why the section uses overflow-clip.
   */
  test("the Continue bar stays pinned and reachable, and the progress rail stays compact", async ({ page }) => {
    await openCalculator(page);

    const box = await continueBtn(page).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(812 + 1);
    // Touch target floor.
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // Mobile progress is "Step X of Y" plus a bar - the named-step rail is
    // reserved for wider screens.
    const railItems = page.locator('[data-testid="wizard-progress"] ol li');
    for (const li of await railItems.all()) {
      await expect(li).toBeHidden();
    }

    // No horizontal overflow at phone width.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  /**
   * Step changes scroll the wizard card into place, and "into place" means
   * BELOW the sticky header - a card top between 0 and the header's height is
   * hidden behind it. That guard read `rect.top >= 0` once, which treated
   * behind-the-header as in-view and left the progress bar buried.
   */
  test("each step change lands the wizard top below the sticky header", async ({ page }) => {
    await openCalculator(page);

    const wizardClearsHeader = async () => {
      // Wait out the smooth scroll before measuring.
      await page.waitForTimeout(700);
      return page.evaluate(() => {
        const header = document.querySelector("header");
        const wizard = document.querySelector("#calculator [data-hydrated]");
        if (!header || !wizard) return { ok: false, top: -1, headerBottom: -1 };
        const top = wizard.getBoundingClientRect().top;
        const headerBottom = header.getBoundingClientRect().bottom;
        return { ok: top >= headerBottom - 2, top, headerBottom };
      });
    };

    await page.getByTestId("calc-stage-need-plans").click();
    let pos = await wizardClearsHeader();
    expect(pos.ok, `after stage step: wizard top ${pos.top} vs header bottom ${pos.headerBottom}`).toBe(true);

    await page.getByTestId("calc-land-not-yet").click();
    pos = await wizardClearsHeader();
    expect(pos.ok, `after land step: wizard top ${pos.top} vs header bottom ${pos.headerBottom}`).toBe(true);

    await page.getByTestId("calc-tab-custom-home").click();
    pos = await wizardClearsHeader();
    expect(pos.ok, `after project step: wizard top ${pos.top} vs header bottom ${pos.headerBottom}`).toBe(true);

    // Back navigation must obey the same rule.
    await page.getByTestId("wizard-back").click();
    pos = await wizardClearsHeader();
    expect(pos.ok, `after back: wizard top ${pos.top} vs header bottom ${pos.headerBottom}`).toBe(true);
  });
});

test.describe("Lead gate", () => {
  /**
   * Every project the calculator offers must be accepted by the lead route,
   * and the range must appear only after that POST succeeds.
   */
  for (const project of PUBLIC_PROJECTS) {
    test(`submitting a ${project} estimate is accepted by /api/estimate-lead`, async ({ page }) => {
      await openCalculator(page);
      await driveToReview(page, { project });

      const response = await submitGate(page);
      expect(
        response.status(),
        `POST /api/estimate-lead rejected a ${project} estimate with ${response.status()}`,
      ).toBeLessThan(400);

      await expect(page.locator('[data-testid="estimate-range"]:visible')).toBeVisible();
      await expect(page.locator('[data-testid="estimate-range"]:visible')).toContainText("$");
      // Edit My Scope is offered with the result.
      await expect(page.getByTestId("button-edit-scope")).toBeVisible();
    });
  }

  test("editing scope after the reveal recalculates without asking for contact again", async ({ page }) => {
    await openCalculator(page);
    await driveToReview(page);
    const response = await submitGate(page);
    expect(response.status()).toBeLessThan(400);
    await expect(page.locator('[data-testid="estimate-range"]:visible')).toBeVisible();
    const firstRange = await page.getByTestId("estimate-range").innerText();

    await page.getByTestId("button-edit-scope").click();
    await expect(page.getByTestId("review-stage")).toBeVisible();
    // Contact is captured, so it is no longer a step in the rail.
    await expect(page.getByTestId("wizard-progress")).not.toContainText("Contact");

    await page.getByTestId("review-size-edit").click();
    const slider = page.locator('[data-testid="calc-sqft-slider"]:visible');
    const max = await slider.getAttribute("max");
    await slider.fill(String(max));
    await continueBtn(page).click(); // back to review
    await continueBtn(page).click(); // review -> results, no gate

    await expect(page.locator('[data-testid="gate-input-name"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="estimate-range"]:visible')).toBeVisible();
    const secondRange = await page.getByTestId("estimate-range").innerText();
    expect(secondRange).not.toBe(firstRange);
  });
});
