import { test, expect } from "@playwright/test";

test.describe("Checklist view (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sites/nonexistent-id");
    await page.waitForLoadState("networkidle");
  });

  test("shows demo mode when site not found", async ({ page }) => {
    await expect(page.getByText("Demo mode", { exact: true })).toBeVisible();
  });

  test("shows scan URL input and buttons", async ({ page }) => {
    await expect(page.locator("input[placeholder*='URL']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Scan site" })).toBeVisible();
    await expect(page.getByRole("button", { name: "AI Analyze" })).toBeVisible();
  });

  test("shows progress counter", async ({ page }) => {
    await expect(page.getByText(/Progress: \d+\/\d+ checked/)).toBeVisible();
  });

  test("shows checklist categories", async ({ page }) => {
    await expect(page.getByText("A. Script setup")).toBeVisible();
  });

  test("category click toggles checks visibility", async ({ page }) => {
    await page.getByText("A. Script setup").click();
    const a1 = page.locator("span.font-mono:text('A1')");
    const wasVisible = await a1.isVisible();
    await page.getByText("A. Script setup").click();
    if (wasVisible) {
      await expect(a1).not.toBeVisible();
    } else {
      await expect(a1).toBeVisible();
    }
  });

  test("scan button disabled when URL is empty", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Scan site" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "AI Analyze" })).toBeDisabled();
  });

  test("URL validation shows error for invalid URL", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("not a url");
    await page.getByRole("button", { name: "Scan site" }).click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
  });

  test("URL validation clears on valid input", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("not a url");
    await page.getByRole("button", { name: "Scan site" }).click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
    await input.fill("example.com");
    await expect(page.getByText("Enter a valid domain")).not.toBeVisible();
  });

  test("check item expands with status and notes", async ({ page }) => {
    const checkRow = page.locator("[class*='border-b']").filter({ hasText: "A1" }).first();
    await checkRow.click();
    await expect(page.locator("textarea[placeholder*='Add notes']").first()).toBeVisible();
  });

  test("check guide drawer opens from info button", async ({ page }) => {
    await page.locator("button[aria-label*='Guide for A1']").click();
    await expect(page.getByText("Why this matters")).toBeVisible();
    await expect(page.getByText("Step-by-step")).toBeVisible();
  });
});
