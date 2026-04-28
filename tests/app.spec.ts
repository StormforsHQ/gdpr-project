import { test, expect } from "@playwright/test";

test.describe("Navigation and page loading", () => {
  test("dashboard loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors.filter((e) => !e.includes("DevTools"))).toHaveLength(0);
  });

  test("sites page loads", async ({ page }) => {
    await page.goto("/sites");
    await expect(page.getByRole("button", { name: "Add site" })).toBeVisible();
  });

  test("reference pages load without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    for (const path of [
      "/reference/technical-guide",
      "/reference/audit-protocol",
      "/reference/cheat-sheet",
      "/reference/mcp-servers",
    ]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }

    expect(errors.filter((e) => !e.includes("DevTools"))).toHaveLength(0);
  });

  test("MCP servers page shows all platforms", async ({ page }) => {
    await page.goto("/reference/mcp-servers");
    await expect(page.locator("h1", { hasText: "MCP Servers" })).toBeVisible();
    await expect(page.getByText("Priority for setup")).toBeVisible();
    await expect(page.getByText("Webflow MCP Server", { exact: true })).toBeVisible();
    await expect(page.getByText("HubSpot MCP Server", { exact: true })).toBeVisible();
  });
});

test.describe("Sidebar", () => {
  test("sidebar shows all navigation sections", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("aside").last();
    await expect(sidebar.getByText("Dashboard")).toBeVisible();
    await expect(sidebar.getByText(/^Sites \(/)).toBeVisible();
    await expect(sidebar.getByText("Reference")).toBeVisible();
  });

  test("sidebar shows status dot legend", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("aside").last();
    await expect(sidebar.getByText("Complete")).toBeVisible();
    await expect(sidebar.getByText("In progress")).toBeVisible();
    await expect(sidebar.getByText("Not started")).toBeVisible();
  });

  test("sidebar shows tech stack", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("aside").last();
    await expect(sidebar.getByText("Stack")).toBeVisible();
    await expect(sidebar.getByText("Next.js 16")).toBeVisible();
  });

  test("sidebar collapses and expands", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const collapseBtn = page.getByLabel("Collapse sidebar").last();
    await expect(collapseBtn).toBeVisible({ timeout: 10000 });
    await collapseBtn.click();
    const expandBtn = page.getByLabel("Expand sidebar");
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();
    await expect(page.getByLabel("Collapse sidebar").last()).toBeVisible();
  });
});

test.describe("Help system", () => {
  test("help drawer opens and shows content", async ({ page }) => {
    await page.goto("/");
    await page.locator("button[aria-label='Help']").click();
    await expect(page.getByText("Quick start")).toBeVisible();
    await expect(page.getByText("How to audit a site")).toBeVisible();
    await expect(page.getByText("Automation types")).toBeVisible();
    await expect(page.getByText("Check statuses")).toBeVisible();
  });

  test("help drawer links to reference docs", async ({ page }) => {
    await page.goto("/");
    await page.locator("button[aria-label='Help']").click();
    const drawer = page.locator("[data-slot='sheet-content']");
    await expect(drawer.getByText("Technical Guide")).toBeVisible();
    await expect(drawer.getByText("Audit Protocol")).toBeVisible();
    await expect(drawer.getByText("Cheat Sheet")).toBeVisible();
  });
});

test.describe("Theme toggle", () => {
  test("theme toggle switches between light and dark", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("button[aria-label='Toggle theme']");
    await toggle.click();
    await page.waitForTimeout(200);
    const htmlClass = await page.locator("html").getAttribute("class");
    const isDark = htmlClass?.includes("dark");
    await toggle.click();
    await page.waitForTimeout(200);
    const htmlClass2 = await page.locator("html").getAttribute("class");
    const isDark2 = htmlClass2?.includes("dark");
    expect(isDark).not.toBe(isDark2);
  });
});
