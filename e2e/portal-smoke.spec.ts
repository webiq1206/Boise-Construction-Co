import { expect, test } from "@playwright/test";

test("portal smoke: admin → subcontractor (no Stripe)", async ({ page }) => {
  // Dev login + seed
  await page.goto("/__dev__/login");
  await expect(page.getByTestId("page-dev-login")).toBeVisible();

  await page.getByTestId("button-dev-login-admin").click();
  await expect(page.getByText(/Compliance Dashboard/i)).toBeVisible();

  await page.goto("/__dev__/login");
  await page.getByTestId("button-dev-seed").click();

  // Admin leads: tab counts remain stable across tab switching
  await page.goto("/admin/leads");
  await expect(page.getByTestId("count-pending")).toBeVisible();

  const pendingCountBefore = await page.getByTestId("count-pending").textContent();
  const acceptedCountBefore = await page.getByTestId("count-accepted").textContent();
  const availableCountBefore = await page.getByTestId("count-available").textContent();
  const purchasedCountBefore = await page.getByTestId("count-purchased").textContent();

  await page.getByTestId("tab-available").click();
  await page.getByTestId("tab-pending").click();

  await expect(page.getByTestId("count-pending")).toHaveText((pendingCountBefore || "").trim());
  await expect(page.getByTestId("count-accepted")).toHaveText((acceptedCountBefore || "").trim());
  await expect(page.getByTestId("count-available")).toHaveText((availableCountBefore || "").trim());
  await expect(page.getByTestId("count-purchased")).toHaveText((purchasedCountBefore || "").trim());

  // Note: the legacy quote wizard was removed (its marketing URLs redirect to
  // /#consult, and /api/quotes returns 410). Homeowner lead capture is covered
  // by e2e/calculator.spec.ts.

  // Subcontractor portal: loads lead marketplace and shows masked leads (no Stripe required)
  await page.goto("/__dev__/login");
  await page.getByTestId("button-dev-login-sub").click();
  await page.goto("/subcontractor/leads");
  await expect(page.getByTestId("page-subcontractor-portal")).toBeVisible();

  const firstCard = page.locator("[data-testid^='card-lead-']").first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard).toContainText("***");
});

