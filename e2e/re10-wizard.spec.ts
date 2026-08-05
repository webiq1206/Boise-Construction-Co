import { test, expect, type Page } from "@playwright/test";

/**
 * RE-10 wizard: auto-advance behaviour.
 *
 * The extractor needs an API key we do not have in CI, so the analyze call is
 * stubbed with a canned repair list. That lets the test reach the short contact
 * steps and prove the one thing worth proving about auto-advance: it fires when
 * a single-choice tap completes the step, and it stays put when a required field
 * is still empty.
 */

const CANNED_ANALYZE = {
  repairs: [
    { verbatim: "Repair leaking kitchen faucet", kind: "plumbing-fixture", confidence: "high" },
    { verbatim: "Replace missing GFCI outlet cover", kind: "electrical-device", confidence: "high" },
  ],
  unmapped: [],
  propertyAddress: "123 Main St, Boise, ID 83702",
  closingDate: null,
  repairDeadline: null,
  looksLikeRe10: true,
  documentNotes: [],
  stored: [{ filename: "re10.pdf", url: "/uploads/re10/test.pdf" }],
  attachedOnly: [],
};

async function reachReview(page: Page) {
  await page.route("**/api/re10/analyze", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(CANNED_ANALYZE),
    }),
  );

  await page.goto("/re-10-repairs-boise");
  await page.locator("#re10-estimator").scrollIntoViewIfNeeded();

  // Attach a file so analyze() clears its "no files" guard, then continue.
  await page.locator("#re10-files").setInputFiles({
    name: "re10.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test document"),
  });
  await page.locator('[data-testid="wizard-continue"]').click();

  // Review step.
  await expect(page.locator('[data-testid="list-re10-repairs"]')).toBeVisible();
}

test.use({ viewport: { width: 390, height: 844 } });

test.describe("RE-10 wizard auto-advance", () => {
  test("selecting a role auto-advances to the contact step once a name is present", async ({ page }) => {
    await reachReview(page);

    // Review -> About you.
    await page.locator('[data-testid="wizard-continue"]').click();
    await expect(page.locator('[data-testid="input-re10-name"]')).toBeVisible();

    // Name filled first, then a single role tap should carry us forward with no
    // Continue press.
    await page.locator('[data-testid="input-re10-name"]').fill("Jane Doe");
    await page.getByRole("radio", { name: "Buyer's agent" }).click();

    // The contact (email/phone) step arrives on its own.
    await expect(page.locator('[data-testid="input-re10-email"]')).toBeVisible({ timeout: 3000 });
  });

  test("a role tap does NOT advance while the required name is empty", async ({ page }) => {
    await reachReview(page);
    await page.locator('[data-testid="wizard-continue"]').click();
    await expect(page.locator('[data-testid="input-re10-name"]')).toBeVisible();

    // No name yet: tapping a role must not move on.
    await page.getByRole("radio", { name: "Seller's agent" }).click();
    await page.waitForTimeout(900);
    await expect(page.locator('[data-testid="input-re10-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-re10-email"]')).toHaveCount(0);
  });

  test("occupancy auto-advances from the property step once an address is present", async ({ page }) => {
    await reachReview(page);
    // Review -> About; fill name + role auto-advances to Contact.
    await page.locator('[data-testid="wizard-continue"]').click();
    await page.locator('[data-testid="input-re10-name"]').fill("Jane Doe");
    await page.getByRole("radio", { name: "Buyer's agent" }).click();

    // Contact -> Property (email is valid, then Continue).
    await expect(page.locator('[data-testid="input-re10-email"]')).toBeVisible();
    await page.locator('[data-testid="input-re10-email"]').fill("jane@example.com");
    await page.locator('[data-testid="wizard-continue"]').click();

    // Property step: address prefilled from the stubbed extraction.
    const address = page.locator('[data-testid="input-re10-address"]');
    await expect(address).toBeVisible();
    await expect(address).not.toHaveValue("");

    // A single occupancy tap advances to Timeline.
    await page.getByRole("radio", { name: "Vacant" }).click();
    await expect(page.getByText("What are your dates?")).toBeVisible({ timeout: 3000 });
  });
});
