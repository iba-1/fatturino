import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Invoice Editing", () => {
  test("should show edit button for draft invoices on detail page", async ({ page }) => {
    await registerAndLogin(page, "inv-edit");

    // Create a client first
    await page.goto("/clients");
    await page.click('button:has-text("New Client"), button:has-text("Nuovo Cliente")');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[id="codiceFiscale"]', "RSSMRA85M01H501Z");
    await page.fill('input[id="ragioneSociale"]', "Test Edit SRL");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");

    // Wait for both the POST and the subsequent GET refetch
    const createClientDone = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/clients"),
      { timeout: 10_000 }
    );
    const refetchDone = page.waitForResponse(
      (res) => res.request().method() === "GET" && res.url().includes("/api/clients"),
      { timeout: 10_000 }
    );
    await page.click('[role="dialog"] button[type="submit"]');
    await createClientDone;
    await refetchDone;
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator("table")).toContainText("Test Edit SRL", { timeout: 10_000 });

    // Create an invoice
    await page.goto("/invoices/new");
    await page.waitForSelector("form");
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:first-child');

    // Fill line item description
    await page.fill(
      'input[placeholder="Description"], input[placeholder="Descrizione"]',
      "Test service"
    );

    // Set price (second number input; first is quantity)
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill("100");

    const createInvoiceResponse = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/invoices"),
      { timeout: 10_000 }
    );
    await page.click('button[type="submit"]');
    await createInvoiceResponse;
    await page.waitForURL("/invoices", { timeout: 10_000 });

    // Navigate to invoice detail
    await page.click('button[aria-label="View"]');
    await page.waitForSelector("h1");

    // Should see Edit button (draft invoice)
    const editButton = page.getByRole("button").filter({ hasText: /^Edit$|^Modifica$/ });
    await expect(editButton).toBeVisible();
  });

  test("should navigate to edit page and show pre-filled form", async ({ page }) => {
    await registerAndLogin(page, "inv-edit2");

    // Create client
    await page.goto("/clients");
    await page.click('button:has-text("New Client"), button:has-text("Nuovo Cliente")');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[id="codiceFiscale"]', "VRDLGI80A01F205X");
    await page.fill('input[id="ragioneSociale"]', "Edit Nav SRL");
    await page.fill('input[id="indirizzo"]', "Via Nav 2");
    await page.fill('input[id="cap"]', "20100");
    await page.fill('input[id="citta"]', "Milano");
    await page.fill('input[id="provincia"]', "MI");

    const createClientDone = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/clients"),
      { timeout: 10_000 }
    );
    const refetchDone = page.waitForResponse(
      (res) => res.request().method() === "GET" && res.url().includes("/api/clients"),
      { timeout: 10_000 }
    );
    await page.click('[role="dialog"] button[type="submit"]');
    await createClientDone;
    await refetchDone;
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator("table")).toContainText("Edit Nav SRL", { timeout: 10_000 });

    // Create invoice
    await page.goto("/invoices/new");
    await page.waitForSelector("form");
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:first-child');

    await page.fill(
      'input[placeholder="Description"], input[placeholder="Descrizione"]',
      "Original service"
    );
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill("200");

    const createInvoiceResponse = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/invoices"),
      { timeout: 10_000 }
    );
    await page.click('button[type="submit"]');
    await createInvoiceResponse;
    await page.waitForURL("/invoices", { timeout: 10_000 });

    // Go to detail then click edit
    await page.click('button[aria-label="View"]');
    await page.waitForSelector("h1");

    const editButton = page.getByRole("button").filter({ hasText: /^Edit$|^Modifica$/ });
    await editButton.click();

    // Should be on edit page with form
    await page.waitForSelector("form");
    await expect(page).toHaveURL(/\/invoices\/.*\/edit/);

    // The description field should have the original value
    const descInput = page.locator(
      'input[placeholder="Description"], input[placeholder="Descrizione"]'
    );
    await expect(descInput).toHaveValue("Original service");
  });
});
