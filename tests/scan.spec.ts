import { test, expect } from "@playwright/test";

test.describe("Scan and AI analyze (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sites/nonexistent-id");
    await page.waitForLoadState("networkidle");
  });

  test("scan button stays disabled for empty URL", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("");
    await expect(
      page.getByRole("button", { name: "Scan site" })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "AI Analyze" })
    ).toBeDisabled();
  });

  test("scan rejects invalid URL formats", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    const scanBtn = page.getByRole("button", { name: "Scan site" });

    for (const invalid of ["just-text", "http://", "ftp://something", ".com"]) {
      await input.fill(invalid);
      await scanBtn.click();
      await expect(page.getByText("Enter a valid domain")).toBeVisible();
    }
  });

  test("scan accepts valid URL formats", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");

    for (const valid of [
      "example.com",
      "https://example.com",
      "sub.example.co.uk",
    ]) {
      await input.fill(valid);
      await expect(page.getByText("Enter a valid domain")).not.toBeVisible();
    }
  });

  test("scan URL input clears error on valid input after invalid", async ({
    page,
  }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("not-valid");
    await page.getByRole("button", { name: "Scan site" }).click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
    await input.fill("example.com");
    await expect(page.getByText("Enter a valid domain")).not.toBeVisible();
  });

  test("AI analyze button is disabled when URL is empty", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.clear();
    await expect(
      page.getByRole("button", { name: "AI Analyze" })
    ).toBeDisabled();
  });

  test("scan buttons are present and labeled correctly", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Scan site" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "AI Analyze" })
    ).toBeVisible();
  });

  test("progress counter starts at zero in demo", async ({ page }) => {
    await expect(page.getByText(/Progress: 0\/\d+ checked/)).toBeVisible();
  });

  test("all checklist categories are visible", async ({ page }) => {
    await expect(page.getByText("Script setup")).toBeVisible();
    await expect(page.getByText("Consent Mode")).toBeVisible();
    await expect(page.getByText("Cookie categories")).toBeVisible();
  });
});

test.describe("Check item interactions (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sites/nonexistent-id");
    await page.waitForLoadState("networkidle");
  });

  test("expanding a check shows status options", async ({ page }) => {
    const checkRow = page
      .locator("[class*='border-b']")
      .filter({ hasText: "A1" })
      .first();
    await checkRow.click();
    await expect(
      page.locator("input[placeholder='Notes...']").first()
    ).toBeVisible();
  });

  test("guide drawer shows step-by-step and legal info", async ({ page }) => {
    await page.locator("button[aria-label*='Guide for A1']").click();
    await expect(page.getByText("Why this matters")).toBeVisible();
    await expect(page.getByText("Step-by-step")).toBeVisible();
  });

  test("multiple categories can be collapsed independently", async ({
    page,
  }) => {
    await page.getByText("A. Script setup").click();
    const a1 = page.locator("span.font-mono:text('A1')");
    const b1 = page.locator("span.font-mono:text('B1')");

    const a1Visible = await a1.isVisible();
    const b1Visible = await b1.isVisible();

    expect(a1Visible).not.toBe(b1Visible);
  });
});
