import { test, expect } from "@playwright/test";

test.describe("Scan edge cases (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sites/nonexistent-id");
    await page.waitForLoadState("networkidle");
  });

  test("scan button disabled when URL is empty", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("");
    await expect(
      page.getByRole("button", { name: "Scan site" })
    ).toBeDisabled();
  });

  test("scan button disabled when URL is only whitespace", async ({
    page,
  }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("   ");
    await expect(
      page.getByRole("button", { name: "Scan site" })
    ).toBeDisabled();
  });

  test("AI analyze button disabled when URL is empty", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.clear();
    await expect(
      page.getByRole("button", { name: "AI Analyze" })
    ).toBeDisabled();
  });

  test("scan rejects protocol-only URLs", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    const scanBtn = page.getByRole("button", { name: "Scan site" });
    await input.fill("http://");
    await scanBtn.click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
  });

  test("scan rejects non-http protocols", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    const scanBtn = page.getByRole("button", { name: "Scan site" });
    await input.fill("ftp://files.example.com");
    await scanBtn.click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
  });

  test("scan rejects dot-only input", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    const scanBtn = page.getByRole("button", { name: "Scan site" });
    await input.fill(".com");
    await scanBtn.click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
  });

  test("scan rejects plain text without TLD", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    const scanBtn = page.getByRole("button", { name: "Scan site" });
    await input.fill("just-text");
    await scanBtn.click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
  });

  test("scan accepts bare domain without protocol", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("example.com");
    await expect(page.getByText("Enter a valid domain")).not.toBeVisible();
  });

  test("scan accepts domain with https protocol", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("https://example.com");
    await expect(page.getByText("Enter a valid domain")).not.toBeVisible();
  });

  test("scan accepts subdomain URLs", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("sub.example.co.uk");
    await expect(page.getByText("Enter a valid domain")).not.toBeVisible();
  });

  test("error clears when switching from invalid to valid URL", async ({
    page,
  }) => {
    const input = page.locator("input[placeholder*='URL']");
    const scanBtn = page.getByRole("button", { name: "Scan site" });
    await input.fill("not-valid");
    await scanBtn.click();
    await expect(page.getByText("Enter a valid domain")).toBeVisible();
    await input.fill("example.com");
    await expect(page.getByText("Enter a valid domain")).not.toBeVisible();
  });

  test("Enter key in URL input triggers scan", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await input.fill("example.com");
    await input.press("Enter");
    await expect(
      page.getByRole("button", { name: "Scanning..." })
    ).toBeVisible();
  });
});
