import { test, expect } from "@playwright/test";

test("chat button visible on sites page and opens panel", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/sites");
  await page.waitForTimeout(1500);

  const chatBtn = page.locator("button.fixed.bottom-6.right-6");
  await expect(chatBtn).toBeVisible();

  await chatBtn.click();
  await expect(page.locator("text=GDPR Help")).toBeVisible();
  await expect(page.locator("text=Ask me anything")).toBeVisible();

  // Check input and send button exist
  await expect(page.locator("textarea[placeholder*='Ask about']")).toBeVisible();

  // Close button works - target the one inside the chat panel header
  const chatPanel = page.locator(".fixed.right-0.top-0.z-50");
  await chatPanel.locator("button").filter({ has: page.locator("svg.lucide-x") }).click();
  await expect(page.locator("text=GDPR Help")).not.toBeVisible();

  const consoleErrors = errors.filter(
    (e) => !e.includes("favicon") && !e.includes("404") && !e.includes("ERR_CONNECTION")
  );
  expect(consoleErrors).toHaveLength(0);
});
