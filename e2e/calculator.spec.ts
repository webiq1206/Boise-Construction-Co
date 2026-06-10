import { expect, test, type Page } from "@playwright/test";

async function openCalculator(page: Page) {
  await page.goto("/#calculator");
  await page.locator("#calculator").scrollIntoViewIfNeeded();
}

test.describe("Project Estimator (desktop)", () => {
  test("nothing is selected by default and no range is shown", async ({ page }) => {
    await openCalculator(page);

    await expect(page.getByTestId("button-project-kitchen")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("button-finish-mid-range")).toHaveAttribute("aria-pressed", "false");

    // Placeholder panel instead of a dollar range.
    await expect(page.locator('[data-testid="estimate-range-placeholder"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="estimate-range"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="estimate-progress-checklist"]:visible')).toBeVisible();

    // Refinements are locked until the core selections are made.
    await expect(page.getByTestId("button-refine-toggle")).toBeDisabled();

    // No estimate is persisted until the user completes the flow.
    const stored = await page.evaluate(() => sessionStorage.getItem("brc_estimate"));
    expect(stored).toBeNull();
  });

  test("range appears only after project, finish, and size are chosen", async ({ page }) => {
    await openCalculator(page);

    await page.getByTestId("button-project-kitchen").click();
    await expect(page.getByTestId("button-project-kitchen")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-testid="estimate-range-placeholder"]:visible')).toBeVisible();

    await page.getByTestId("button-finish-mid-range").click();
    await expect(page.locator('[data-testid="estimate-range-placeholder"]:visible')).toBeVisible();

    await page.getByTestId("size-preset-typical").click();
    await expect(page.locator('[data-testid="estimate-range"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="slider-size"]:visible')).toBeVisible();

    // Now the estimate is persisted for the consultation handoff.
    const stored = await page.evaluate(() => sessionStorage.getItem("brc_estimate"));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.project).toBe("kitchen");
    expect(parsed.finish).toBe("mid-range");
    expect(parsed.priceLow).toBeGreaterThan(0);
  });

  test("changing project clears size so nothing carries over implicitly", async ({ page }) => {
    await openCalculator(page);

    await page.getByTestId("button-project-kitchen").click();
    await page.getByTestId("button-finish-mid-range").click();
    await page.getByTestId("size-preset-typical").click();
    await expect(page.locator('[data-testid="estimate-range"]:visible')).toBeVisible();

    await page.getByTestId("button-project-whole-home").click();
    await expect(page.getByTestId("button-project-whole-home")).toHaveAttribute("aria-pressed", "true");
    // Size resets; the range disappears until a new size is chosen.
    await expect(page.locator('[data-testid="estimate-range-placeholder"]:visible')).toBeVisible();
  });

  test("refinements unlock when complete, update detail level, and can be cleared", async ({ page }) => {
    await openCalculator(page);

    await page.getByTestId("button-project-kitchen").click();
    await page.getByTestId("button-finish-mid-range").click();
    await page.getByTestId("size-preset-typical").click();

    const toggle = page.getByTestId("button-refine-toggle");
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const resultPanel = page.locator('[data-testid="estimate-result-panel"]:visible');
    await page.getByTestId("layout-major").click();
    await page.getByTestId("plumbing-full").click();
    await page.getByTestId("cabinet-custom").click();
    await expect(resultPanel.getByText("Detailed planning range")).toBeVisible();

    // Tapping a selected option again clears it.
    await page.getByTestId("layout-major").click();
    await expect(page.getByTestId("layout-major")).toHaveAttribute("aria-pressed", "false");
    await expect(resultPanel.getByText("Refined guidance")).toBeVisible();
  });

  test("consultation CTA is available once an estimate exists", async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId("button-project-bathroom").click();
    await page.getByTestId("button-finish-mid-range").click();
    await page.getByTestId("size-preset-typical").click();
    await expect(page.locator('[data-testid="button-book-visit"]:visible')).toBeVisible();
  });
});

test.describe("Project Estimator (mobile guided flow)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("steps through the guided flow with a bottom-anchored estimate bar", async ({ page }) => {
    await openCalculator(page);

    await expect(page.getByTestId("estimate-stepper")).toBeVisible();
    await expect(page.getByTestId("step-heading")).toHaveText("What are we remodeling?");

    // Sticky bar is pinned to the bottom of the viewport and replaces the
    // global Call/Text bar.
    const bar = page.getByTestId("mobile-estimate-bar");
    await expect(bar).toBeVisible();
    await expect(page.getByTestId("mobile-estimate-placeholder")).toBeVisible();
    await expect(page.getByTestId("button-call-mobile")).toBeHidden();

    const viewportHeight = page.viewportSize()!.height;
    const barBox = await bar.boundingBox();
    expect(barBox).not.toBeNull();
    expect(Math.abs(barBox!.y + barBox!.height - viewportHeight)).toBeLessThanOrEqual(1);

    // Step 1: project (auto-advances).
    await page.getByTestId("step-button-project-kitchen").click();
    await expect(page.getByTestId("step-heading")).toHaveText("Choose a finish level");

    // Step 2: finish (auto-advances).
    await page.getByTestId("step-button-finish-mid-range").click();
    await expect(page.getByTestId("step-heading")).toHaveText("How big is the space?");

    // Step 3: size preset reveals the fine-tune slider and live range.
    await page.getByTestId("step-size-preset-typical").click();
    await expect(page.getByTestId("step-slider-size")).toBeVisible();
    await expect(page.getByTestId("mobile-estimate-range")).toBeVisible();

    // Continue to the optional details step via the sticky bar.
    await page.getByTestId("mobile-button-book-visit").click();
    await expect(page.getByTestId("step-heading")).toHaveText("Tailor your range (optional)");

    // Skip details, land on review with the full result panel.
    await page.getByTestId("button-skip-refine").click();
    await expect(page.getByTestId("step-heading")).toHaveText("Your planning range");
    await expect(page.locator('[data-testid="estimate-range"]:visible')).toBeVisible();

    // The bar still hugs the bottom after navigating.
    const barBoxAfter = await bar.boundingBox();
    expect(Math.abs(barBoxAfter!.y + barBoxAfter!.height - viewportHeight)).toBeLessThanOrEqual(1);
  });

  test("expandable summary sheet shows scope details", async ({ page }) => {
    await openCalculator(page);

    await page.getByTestId("step-button-project-bathroom").click();
    await page.getByTestId("step-button-finish-mid-range").click();
    await page.getByTestId("step-size-preset-typical").click();
    await expect(page.getByTestId("mobile-estimate-range")).toBeVisible();

    await page.getByTestId("estimate-bar-toggle").click();
    await expect(page.getByTestId("estimate-bar-sheet")).toBeVisible();
    await expect(page.getByTestId("estimate-bar-sheet")).toContainText("Planning estimate only");

    await page.getByTestId("estimate-bar-toggle").click();
    await expect(page.getByTestId("estimate-bar-sheet")).toBeHidden();
  });

  test("back navigation and progress dots work", async ({ page }) => {
    await openCalculator(page);

    await page.getByTestId("step-button-project-kitchen").click();
    await expect(page.getByTestId("step-heading")).toHaveText("Choose a finish level");

    await page.getByTestId("button-step-back").click();
    await expect(page.getByTestId("step-heading")).toHaveText("What are we remodeling?");
    await expect(page.getByTestId("step-button-project-kitchen")).toHaveAttribute("aria-pressed", "true");
  });

  test("modal estimator hands off to the consultation modal", async ({ page }) => {
    // Off-homepage, the estimator opens in a modal with the same guided flow.
    await page.goto("/contact");
    await page.getByText("Get your planning range").first().click();

    await expect(page.getByTestId("estimate-stepper")).toBeVisible();
    await page.getByTestId("step-button-project-adu").click();
    await page.getByTestId("step-button-finish-mid-range").click();
    await page.getByTestId("step-size-preset-typical").click();
    await expect(page.getByTestId("mobile-estimate-range")).toBeVisible();

    // Continue → refine → review, then schedule from the bar.
    await page.getByTestId("mobile-button-book-visit").click();
    await page.getByTestId("button-skip-refine").click();
    await expect(page.locator('[data-testid="estimate-range"]:visible')).toBeVisible();
    await page.getByTestId("mobile-button-book-visit").click();

    // Consultation modal opens with the ADU estimate carried over.
    const consultDialog = page.getByRole("dialog", { name: /Schedule your free in-home/ });
    await expect(consultDialog).toBeVisible();
    await expect(consultDialog.getByTestId("text-estimate-summary")).toContainText("ADU");
    await expect(consultDialog.getByTestId("consult-trust-bullets")).toBeVisible();
  });
});
