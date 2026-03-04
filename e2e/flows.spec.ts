import { test, expect } from "@playwright/test";

/**
 * End-to-end user journey tests.
 * Each test walks through a complete flow from scratch (fresh account)
 * to verify the full stack works together.
 */

test.describe("User Journey", () => {
  test("register → create client → create invoice → view preview", async ({ page }) => {
    const email = `flow-journey-${Date.now()}@test.com`;

    // 1. Register a new account
    await page.goto("/register");
    await page.fill('input[id="name"]', "Journey Tester");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', "Test1234!@");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText(/dashboard/i);

    // 2. Create a client
    await page.goto("/clients");
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 5_000 });
    await page.click('button:has-text("Nuovo Cliente"), button:has-text("New Client")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.fill('input[id="ragioneSociale"]', "Journey Srl");
    await page.fill('input[id="codiceFiscale"]', "77700007771");
    await page.fill('input[id="partitaIva"]', "77700007771");
    await page.fill('input[id="indirizzo"]', "Via del Corso 1");
    await page.fill('input[id="cap"]', "00186");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.click('[role="dialog"] button[type="submit"]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator("table")).toContainText("Journey Srl");

    // 3. Create an invoice for that client
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:has-text("Journey Srl")');
    await page.fill('input[placeholder="Description"]', "Consulenza strategica");
    const numberInputs = page.locator('form input[type="number"]');
    await numberInputs.nth(0).fill("3");   // quantity
    await numberInputs.nth(1).fill("500"); // unit price

    // Totals: subtotal 1500, bollo 2.00, total 1502.00
    const totals = page.locator("form .flex.flex-col.items-end");
    await expect(totals).toContainText("1500.00");
    await expect(totals).toContainText("2.00");
    await expect(totals).toContainText("1502.00");

    const createResponse = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/invoices")
    );
    await page.click('button[type="submit"]');
    await createResponse;
    await expect(page).toHaveURL("/invoices", { timeout: 10_000 });
    await expect(page.locator("table")).toContainText("1502.00");

    // 4. View the invoice preview — open dropdown then click View
    await page.locator("table button").filter({ has: page.locator(".sr-only") }).first().click();
    await page.locator('[role="menuitem"]').filter({ hasText: /view|visualizza/i }).click();
    await expect(page).toHaveURL(/\/invoices\/.+/);
    await expect(page.locator('[data-testid="invoice-preview"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText("Consulenza strategica");
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText("1500.00");
  });
});
