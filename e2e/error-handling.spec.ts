import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Error Handling & Notifications", () => {
  test("should show toast on successful profile save", async ({ page }) => {
    await registerAndLogin(page, "toast-profile");
    await page.goto("/settings");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Fill all required profile fields with valid data
    await page.fill('input[id="ragioneSociale"]', "Test Business");
    await page.fill('input[id="partitaIva"]', "12345678901");
    await page.fill('input[id="codiceFiscale"]', "TSTBSN80A01H501Z");
    await page.fill('input[id="codiceAteco"]', "62.01.00");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.fill('input[id="annoInizioAttivita"]', "2020");

    // Submit the form
    await page.click('button[type="submit"]');

    // Toast notification should appear on success
    await expect(
      page.locator("[data-radix-toast-viewport] li")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should show toast and inline error on profile validation failure", async ({
    page,
  }) => {
    await registerAndLogin(page, "toast-invalid");
    await page.goto("/settings");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Fill required fields but with an INVALID codiceFiscale
    await page.fill('input[id="ragioneSociale"]', "Test Business");
    await page.fill('input[id="partitaIva"]', "12345678901");
    await page.fill('input[id="codiceFiscale"]', "INVALID");
    await page.fill('input[id="codiceAteco"]', "62.01.00");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.fill('input[id="annoInizioAttivita"]', "2020");

    // Submit the form
    await page.click('button[type="submit"]');

    // Destructive toast should appear
    await expect(
      page.locator("[data-radix-toast-viewport] li")
    ).toBeVisible({ timeout: 5_000 });

    // Inline validation error should appear next to the invalid field
    await expect(
      page.locator("form .text-destructive")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should show toast on successful client creation", async ({ page }) => {
    await registerAndLogin(page, "toast-client");
    await page.goto("/clients");

    // Open new client dialog
    await page.click(
      'button:has-text("Nuovo Cliente"), button:has-text("New Client")'
    );
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill client form
    await page.fill('input[id="ragioneSociale"]', "Toast Test Srl");
    await page.fill('input[id="codiceFiscale"]', "99999999999");
    await page.fill('input[id="partitaIva"]', "99999999999");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");

    // Submit
    await page.click('[role="dialog"] button[type="submit"]');

    // Toast notification should appear on success
    await expect(
      page.locator("[data-radix-toast-viewport] li")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should show toast on delete failure", async ({ page }) => {
    await registerAndLogin(page, "toast-delete-fail");

    // Mock DELETE /api/invoices/* to return 400
    await page.route("**/api/invoices/*", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Cannot delete this invoice" }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET /api/invoices to return a draft invoice
    await page.route("**/api/invoices", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "mocked-draft-id",
              numeroFattura: 1,
              anno: 2026,
              stato: "bozza",
              clientId: "mocked-client",
              dataEmissione: new Date().toISOString().slice(0, 10),
              totaleDocumento: "500.00",
              imponibile: "500.00",
              iva: "0.00",
              bollo: "0.00",
              causale: "",
              righe: [],
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/invoices");
    await expect(page.locator("table")).toBeVisible({ timeout: 5_000 });

    // Click delete button
    await page.click('button[aria-label="Delete"]');

    // Confirm in alert dialog
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();
    await page.click('[role="alertdialog"] button:has-text("Delete")');

    // Toast should appear with error
    await expect(
      page.locator("[data-radix-toast-viewport] li")
    ).toBeVisible({ timeout: 5_000 });
  });
});
