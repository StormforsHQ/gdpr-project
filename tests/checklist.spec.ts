import { test, expect } from "@playwright/test";

test.describe("Checklist view (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sites/nonexistent-id");
    await page.waitForLoadState("networkidle");
  });

  test("shows demo mode when site not found", async ({ page }) => {
    await expect(page.getByText("Demo mode", { exact: true })).toBeVisible();
  });

  test("shows scan URL input and button", async ({ page }) => {
    await expect(page.locator("input[placeholder*='URL']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Scan site" })).toBeVisible();
  });

  test("shows progress counter", async ({ page }) => {
    await expect(page.getByText(/\d+\/\d+ checked/)).toBeVisible();
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

  test("scan button disabled when no audit type selected", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Scan site" })).toBeDisabled();
  });

  test("URL validation shows error for invalid URL", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("not a url");
    // Select an audit type first so the scan button is enabled
    await page.getByText("Audit type").click();
    await page.getByText("SLA client (20 checks)").click();
    await page.getByRole("button", { name: "Scan site" }).click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
  });

  test("URL validation clears on valid input", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("not a url");
    await page.getByText("Audit type").click();
    await page.getByText("SLA client (20 checks)").click();
    await page.getByRole("button", { name: "Scan site" }).click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
    await input.fill("example.com");
    await expect(page.getByText("Enter a valid domain")).not.toBeVisible();
  });

  test("check item expands with status and notes", async ({ page }) => {
    const checkRow = page.locator("[class*='border-b']").filter({ hasText: "A1" }).first();
    await checkRow.click();
    const statusSelect = page.getByRole("combobox").first();
    await expect(statusSelect).toBeVisible();
  });

  test("check guide drawer opens from info button", async ({ page }) => {
    await page.locator("button[aria-label*='Guide for A1']").click();
    await expect(page.getByText("Why this matters")).toBeVisible();
    await expect(page.getByText("How to check")).toBeVisible();
  });
});
