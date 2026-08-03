/**
 * Browser-level regression tests for the new-construction estimator.
 *
 * The previous version of this file tested the remodeling estimator: kitchen
 * and bathroom project tabs, cabinet-tier and plumbing refinements, a mobile
 * stepper headed "What are we remodeling?". None of that UI survived the
 * repositioning, and because Playwright waits for a locator rather than
 * failing on a missing one, the whole suite timed out instead of reporting
 * that it was testing a page that no longer exists.
 *
 * The gate test at the bottom is the important one. The estimator hides the
 * range behind a contact form that POSTs to /api/estimate-lead, and a 4xx from
 * that route does NOT reveal the estimate: it shows "Something went wrong" and
 * keeps the gate shut. For the whole repositioning that route rejected every
 * new-construction project type, so every visitor who finished the estimator
 * and typed in their details hit a dead end and the lead was never recorded.
 * The assertion is on the response status rather than on the revealed range,
 * because 5xx and network failures deliberately reveal the range anyway (so
 * infrastructure trouble never blocks a real person) and would mask a 4xx.
 */
import { expect, test, type Page } from "@playwright/test";

/** The four projects the public estimator offers. */
const PUBLIC_PROJECTS = [
  "custom-home",
  "semi-custom-home",
  "build-on-your-lot",
  "shop-home",
] as const;

/** Retired from the public calculator; must not reappear as tabs. */
const REMODEL_PROJECTS = ["kitchen", "bathroom", "whole-home", "basement"] as const;

/** The four planning stages, which are now the estimator's first question. */
const PLANNING_STAGES = [
  "have-plans",
  "plans-in-progress",
  "need-plans",
  "exploring",
] as const;

async function openCalculator(page: Page) {
  await page.goto("/#calculator");
  await page.locator("#calculator").scrollIntoViewIfNeeded();
}

/**
 * Answer question one. Nothing else in the estimator renders until this is
 * done, so almost every test needs it.
 */
async function chooseStage(page: Page, stage: string = "have-plans") {
  await page.getByTestId(`calc-stage-${stage}`).click();
}

/**
 * Drive the estimator to the point where every required input is answered.
 *
 * Bath count and kitchen inclusion are conditional on the project, so they are
 * answered only when present rather than assumed either way. The structures
 * step needs no interaction: reaching it records "asked, none wanted", which is
 * a complete answer.
 */
async function completeInputs(page: Page, project: string, stage = "have-plans") {
  await chooseStage(page, stage);
  await page.getByTestId(`calc-tab-${project}`).click();

  const subtype = page.locator('[data-testid^="calc-subtype-"]:visible').first();
  await expect(subtype).toBeVisible();
  await subtype.click();

  const baths = page.locator('[data-testid^="calc-baths-"]:visible').first();
  if (await baths.count()) await baths.click();

  const kitchen = page.locator('[data-testid="calc-kitchen-yes"]:visible');
  if (await kitchen.count()) await kitchen.click();

  await page.getByTestId("calc-finish-mid-range").click();
}

test.describe("New construction estimator", () => {
  test("opens on planning stage, and offers nothing else until it is answered", async ({ page }) => {
    await openCalculator(page);

    // Question one is present, unanswered, and is the ONLY thing on offer.
    for (const stage of PLANNING_STAGES) {
      await expect(page.getByTestId(`calc-stage-${stage}`)).toBeVisible();
    }
    await expect(page.locator('[data-testid^="calc-stage-"][aria-checked="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="calc-tab-"]')).toHaveCount(0);

    // No price is shown, and nothing is persisted, before the visitor chooses.
    await expect(page.locator('[data-testid="estimate-range"]')).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("brc_estimate"))).toBeNull();
  });

  test("offers only new-construction projects once a stage is chosen", async ({ page }) => {
    await openCalculator(page);
    await chooseStage(page);

    for (const project of PUBLIC_PROJECTS) {
      await expect(page.getByTestId(`calc-tab-${project}`)).toBeVisible();
    }
    for (const project of REMODEL_PROJECTS) {
      await expect(page.getByTestId(`calc-tab-${project}`)).toHaveCount(0);
    }

    // Nothing is preselected, so no tab reports itself as the current one.
    await expect(page.locator('[data-testid^="calc-tab-"][aria-selected="true"]')).toHaveCount(0);
  });

  test("reveals each step only once the one before it is answered", async ({ page }) => {
    await openCalculator(page);
    await chooseStage(page);

    // Before a project: no layout cards, no size slider, no finish levels.
    await expect(page.locator('[data-testid^="calc-subtype-"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="calc-sqft-slider"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="calc-finish-mid-range"]')).toHaveCount(0);

    await page.getByTestId("calc-tab-custom-home").click();
    await expect(page.locator('[data-testid^="calc-subtype-"]:visible').first()).toBeVisible();
    // A layout is still unchosen, so size and finish stay hidden.
    await expect(page.locator('[data-testid="calc-sqft-slider"]')).toHaveCount(0);

    await page.locator('[data-testid^="calc-subtype-"]:visible').first().click();
    await expect(page.locator('[data-testid="calc-sqft-slider"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="calc-finish-mid-range"]:visible')).toBeVisible();

    // The range is gated behind contact details, so completing the inputs
    // surfaces the CTA rather than a price.
    await completeInputs(page, "custom-home");
    await expect(page.locator('[data-testid="button-get-estimate"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="estimate-range"]')).toHaveCount(0);
  });

  test("square footage is settable and survives a layout change", async ({ page }) => {
    await openCalculator(page);
    await chooseStage(page);
    await page.getByTestId("calc-tab-custom-home").click();
    await page.locator('[data-testid^="calc-subtype-"]:visible').first().click();

    const slider = page.locator('[data-testid="calc-sqft-slider"]:visible');
    const value = page.locator('[data-testid="calc-sqft-value"]:visible');

    const initial = await value.textContent();
    expect(initial).toBeTruthy();

    // Drag to the maximum; the readout must follow the control.
    const max = await slider.getAttribute("max");
    await slider.fill(String(max));
    await expect(value).not.toHaveText(initial!);
    await expect(value).toContainText(Number(max).toLocaleString());
  });

  test("switching project swaps in that project's own layout options", async ({ page }) => {
    await openCalculator(page);
    await chooseStage(page);

    await page.getByTestId("calc-tab-custom-home").click();
    const customSubtypes = await page
      .locator('[data-testid^="calc-subtype-"]:visible')
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));

    await page.getByTestId("calc-tab-shop-home").click();
    await expect(page.getByTestId("calc-tab-shop-home")).toHaveAttribute("aria-selected", "true");
    const shopSubtypes = await page
      .locator('[data-testid^="calc-subtype-"]:visible')
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));

    expect(shopSubtypes.length).toBeGreaterThan(0);
    expect(shopSubtypes).not.toEqual(customSubtypes);
  });
});

/**
 * The stored estimate is what both emails and the CRM record are built from.
 *
 * Polled rather than read once. The estimator writes this from an effect, so a
 * bare read races the write, and because sessionStorage survives a same-page
 * navigation the loser of that race is not null - it is the PREVIOUS flow's
 * estimate, which reads as a real answer and makes the assertion fail in a way
 * that looks like a pricing bug. Passing `want` makes the wait specific.
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

/** Drop any estimate left over from an earlier flow in the same page. */
async function clearStoredEstimate(page: Page) {
  await page.evaluate(() => sessionStorage.removeItem("brc_estimate"));
}

test.describe("Accessory structures", () => {
  /**
   * A control that changes no number is worse than no control: it teaches
   * people the estimator is decorative. Both the structure and its follow-ups
   * must move the range.
   */
  test("ticking a shop raises the range, and heating it raises it again", async ({ page }) => {
    await openCalculator(page);
    await completeInputs(page, "custom-home");

    const before = await storedEstimate(
      page,
      (e) => e?.refinements?.accessoryStructures?.length === 0,
    );

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
  });

  /**
   * A shop home already carries its shop through the subtype preset, and the
   * two price through different paths, so offering the chip as well would let a
   * visitor be charged twice with nothing downstream to catch it.
   */
  test("the shop chip is not offered on a shop home", async ({ page }) => {
    await openCalculator(page);
    await completeInputs(page, "shop-home");
    await expect(page.locator('[data-testid="calc-structure-shop"]')).toHaveCount(0);
    // The other structures are still on offer.
    await expect(page.locator('[data-testid="calc-structure-barn"]:visible')).toBeVisible();
  });
});

test.describe("Plan upload", () => {
  /**
   * Offered only to the two stages that have drawings to give.
   *
   * Deliberately asserts visibility rather than the result of an upload: what
   * comes back depends on whether ANTHROPIC_API_KEY is set in the environment
   * running the test, and a test that passes locally only because the feature
   * is switched off is worse than no test.
   */
  test("is offered to visitors with plans and withheld from those without", async ({ page }) => {
    await openCalculator(page);
    await completeInputs(page, "custom-home", "have-plans");
    await expect(page.locator('[data-testid="calc-plan-upload"]')).toHaveCount(1);

    await openCalculator(page);
    await clearStoredEstimate(page);
    await completeInputs(page, "custom-home", "exploring");
    await expect(page.locator('[data-testid="calc-plan-upload"]')).toHaveCount(0);
    // The rest of the flow is unaffected by the step being absent.
    await expect(page.locator('[data-testid="calc-structure-shop"]:visible')).toBeVisible();
  });
});

test.describe("Client and server agree on the price", () => {
  /**
   * The estimate is computed in the browser and RECOMPUTED on the server, which
   * then wins: it is what goes into both emails and the CRM. The wire schema
   * strips unknown keys rather than rejecting them, so a priced field missing
   * from it does not fail the request - the server silently prices without it
   * and quotes a number the visitor never saw.
   *
   * That is what happened when accessory structures and planning stage were
   * added: both moved the price, neither was in the schema. A visitor could add
   * a shop worth six figures, watch the range move, and be emailed the range
   * without it.
   *
   * Asserting on the revealed range is not enough - the client shows its own
   * figure. This drives a structure that materially moves the price and checks
   * the server's own recomputation against it via the response.
   */
  test("a shop survives the round trip to the lead route", async ({ page }) => {
    await openCalculator(page);
    await completeInputs(page, "custom-home");

    await page.getByTestId("calc-structure-shop").click();
    const local = await storedEstimate(
      page,
      (e) => e?.refinements?.accessoryStructures?.length === 1,
    );

    await page.getByTestId("button-get-estimate").click();
    await page.getByTestId("gate-input-name").fill("Test Homeowner");
    await page.getByTestId("gate-input-email").fill("test.homeowner@example.com");
    await page.getByTestId("gate-input-phone").fill("2085550147");
    const address = page.locator('[data-testid="gate-input-address"]:visible');
    if (await address.count()) await address.fill("1234 W Test St, Boise, ID 83702");

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/estimate-lead") && res.request().method() === "POST",
    );
    await page.getByTestId("button-gate-submit").click();
    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    /*
     * The server echoes what it recomputed. If the structure had been stripped
     * the figure would come back materially lower, because a 1,600 SF shop is
     * worth roughly $130k of the total.
     */
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
  /**
   * Completed drawings earn a tighter band than idle curiosity. Before this the
   * two were quoted identically, which overstated one and understated the other.
   */
  test("a visitor with plans is quoted a narrower band than one still exploring", async ({ page }) => {
    await openCalculator(page);
    await completeInputs(page, "custom-home", "have-plans");
    const withPlans = await storedEstimate(
      page,
      (e) => e?.refinements?.planningStage === "have-plans",
    );

    /* sessionStorage survives this navigation, so without the clear the next
       read can return the have-plans estimate above and the comparison silently
       becomes a range against itself. */
    await openCalculator(page);
    await clearStoredEstimate(page);
    await completeInputs(page, "custom-home", "exploring");
    const exploring = await storedEstimate(
      page,
      (e) => e?.refinements?.planningStage === "exploring",
    );

    const width = (e: { priceLow: number; priceHigh: number }) =>
      (e.priceHigh - e.priceLow) / (e.priceHigh + e.priceLow);

    expect(width(withPlans)).toBeLessThan(width(exploring));
  });
});

test.describe("Lead gate", () => {
  /**
   * Every project the calculator offers must be accepted by the lead route.
   * This is the regression that shipped: the route's Zod enum listed only the
   * six remodel project types, so all four of these 400ed.
   */
  for (const project of PUBLIC_PROJECTS) {
    test(`submitting a ${project} estimate is accepted by /api/estimate-lead`, async ({ page }) => {
      await openCalculator(page);
      await completeInputs(page, project);

      await page.getByTestId("button-get-estimate").click();

      await page.getByTestId("gate-input-name").fill("Test Homeowner");
      await page.getByTestId("gate-input-email").fill("test.homeowner@example.com");
      await page.getByTestId("gate-input-phone").fill("2085550147");

      // Collected at step 2 when filled; the gate falls back to its own input.
      const address = page.locator('[data-testid="gate-input-address"]:visible');
      if (await address.count()) await address.fill("1234 W Test St, Boise, ID 83702");

      const responsePromise = page.waitForResponse(
        (res) => res.url().includes("/api/estimate-lead") && res.request().method() === "POST",
      );
      await page.getByTestId("button-gate-submit").click();
      const response = await responsePromise;

      // 4xx means we sent something the route refuses to parse, and the visitor
      // is shown a generic error with the gate still closed. 5xx is a DB or
      // mail failure, which is an environment problem rather than a contract
      // one, and the client deliberately reveals the estimate anyway.
      expect(
        response.status(),
        `POST /api/estimate-lead rejected a ${project} estimate with ${response.status()}`,
      ).toBeLessThan(400);

      await expect(page.locator('[data-testid="estimate-range"]:visible')).toBeVisible();
      await expect(page.locator('[data-testid="estimate-range"]:visible')).toContainText("$");
    });
  }
});
