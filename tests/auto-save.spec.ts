import { test, expect } from "@playwright/test";

test.describe("Check state management (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sites/nonexistent-id");
    await page.waitForLoadState("networkidle");
  });

  test("expanding a check shows status select and notes input", async ({
    page,
  }) => {
    const checkRow = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A1" })
      .first();
    await checkRow.click();
    await expect(
      page.locator("textarea[placeholder='Add notes...']").first()
    ).toBeVisible();
    const statusSelect = page.getByRole("combobox").first();
    await expect(statusSelect).toBeVisible();
  });

  test("changing check status to OK updates progress counter", async ({
    page,
  }) => {
    await expect(page.getByText(/Progress: 0\/\d+ checked/)).toBeVisible();

    const checkRow = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A1" })
      .first();
    await checkRow.click();

    const statusSelect = page.getByRole("combobox").first();
    await statusSelect.click();
    await page.getByRole("option", { name: "OK" }).click();

    await expect(page.getByText(/Progress: 1\/\d+ checked/)).toBeVisible();
  });

  test("changing check status to Issue updates progress and shows issue count", async ({
    page,
  }) => {
    const checkRow = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A1" })
      .first();
    await checkRow.click();

    const statusSelect = page.getByRole("combobox").first();
    await statusSelect.click();
    await page.getByRole("option", { name: "Issue" }).click();

    await expect(page.getByText(/Progress: 1\/\d+ checked/)).toBeVisible();
    await expect(page.getByText(/Issues \(1\)/).first()).toBeVisible();
  });

  test("notes input accepts and retains text", async ({ page }) => {
    const checkRow = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A1" })
      .first();
    await checkRow.click();

    const notesInput = page.locator("textarea[placeholder='Add notes...']").first();
    await notesInput.fill("Test note for A1 check");
    await expect(notesInput).toHaveValue("Test note for A1 check");
  });

  test("rapid status changes settle on final value", async ({ page }) => {
    const checkRow = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A1" })
      .first();
    await checkRow.click();

    const statusSelect = page.getByRole("combobox").first();

    await statusSelect.click();
    await page.getByRole("option", { name: "OK" }).click();

    await statusSelect.click();
    await page.getByRole("option", { name: "Issue" }).click();

    await statusSelect.click();
    await page.getByRole("option", { name: "N/A" }).click();

    await statusSelect.click();
    await page.getByRole("option", { name: "OK" }).click();

    await expect(page.getByText(/Progress: 1\/\d+ checked/)).toBeVisible();
  });

  test("multiple checks can be set independently", async ({ page }) => {
    const a1Row = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A1" })
      .first();
    await a1Row.click();
    const a1Select = page.getByRole("combobox").first();
    await a1Select.click();
    await page.getByRole("option", { name: "OK" }).click();

    const a2Row = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A2" })
      .first();
    await a2Row.click();
    const selects = page.getByRole("combobox");
    const a2Select = selects.nth(1);
    await a2Select.click();
    await page.getByRole("option", { name: "Issue" }).click();

    await expect(page.getByText(/Progress: 2\/\d+ checked/)).toBeVisible();
  });

  test("resetting check to Not checked decrements progress", async ({
    page,
  }) => {
    const checkRow = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A1" })
      .first();
    await checkRow.click();

    const statusSelect = page.getByRole("combobox").first();
    await statusSelect.click();
    await page.getByRole("option", { name: "OK" }).click();
    await expect(page.getByText(/Progress: 1\/\d+ checked/)).toBeVisible();

    await statusSelect.click();
    await page.getByRole("option", { name: "Not checked" }).click();
    await expect(page.getByText(/Progress: 0\/\d+ checked/)).toBeVisible();
  });
});
