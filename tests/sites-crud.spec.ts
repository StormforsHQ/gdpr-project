import { test, expect } from "@playwright/test";

test.describe("Sites page", () => {
  test("sites page loads and shows add button", async ({ page }) => {
    await page.goto("/sites");
    await expect(page.locator("h1", { hasText: "Sites" })).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("button", { name: "Add site" })
    ).toBeVisible();
  });

  test("add site dialog opens and has all fields", async ({ page }) => {
    await page.goto("/sites");
    await page.getByRole("main").getByRole("button", { name: "Add site" }).click();
    await expect(
      page.getByRole("heading", { name: "Add site" })
    ).toBeVisible();
    await expect(page.getByLabel("Site name")).toBeVisible();
    await expect(page.getByLabel("URL")).toBeVisible();
    await expect(page.getByText("Platform")).toBeVisible();
    await expect(page.getByLabel("Cookiebot ID")).toBeVisible();
    await expect(page.getByLabel("GTM Container ID")).toBeVisible();
  });

  test("add site submit button disabled when fields empty", async ({
    page,
  }) => {
    await page.goto("/sites");
    await page.getByRole("main").getByRole("button", { name: "Add site" }).click();
    const submitBtn = page
      .getByRole("dialog")
      .getByRole("button", { name: "Add site" });
    await expect(submitBtn).toBeDisabled();
  });

  test("add site submit button enables when required fields filled", async ({
    page,
  }) => {
    await page.goto("/sites");
    await page.getByRole("main").getByRole("button", { name: "Add site" }).click();
    await page.getByLabel("Site name").fill("Test Site");
    await page.getByLabel("URL").fill("test.example.com");
    const submitBtn = page
      .getByRole("dialog")
      .getByRole("button", { name: "Add site" });
    await expect(submitBtn).toBeEnabled();
  });

  test("add site dialog closes on cancel", async ({ page }) => {
    await page.goto("/sites");
    await page.getByRole("main").getByRole("button", { name: "Add site" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("add site dialog clears form on close and reopen", async ({ page }) => {
    await page.goto("/sites");
    await page.getByRole("main").getByRole("button", { name: "Add site" }).click();
    await page.getByLabel("Site name").fill("Typed Name");
    await page.getByLabel("URL").fill("typed.example.com");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("main").getByRole("button", { name: "Add site" }).click();
    await expect(page.getByLabel("Site name")).toHaveValue("");
    await expect(page.getByLabel("URL")).toHaveValue("");
  });

  test("platform select shows all options", async ({ page }) => {
    await page.goto("/sites");
    await page.getByRole("main").getByRole("button", { name: "Add site" }).click();
    const trigger = page.getByRole("dialog").getByRole("combobox");
    await trigger.click();
    await expect(page.getByRole("option", { name: "Webflow" })).toBeVisible();
    await expect(page.getByRole("option", { name: "HubSpot" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Next.js" })).toBeVisible();
    await expect(
      page.getByRole("option", { name: "WordPress" })
    ).toBeVisible();
    await expect(page.getByRole("option", { name: "Other" })).toBeVisible();
  });
});
