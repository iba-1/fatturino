import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Error Handling & Notifications", () => {
  test("should show toast on successful profile save", async ({ page }) => {
    await registerAndLogin(page, "toast-profile");
    await page.goto("/settings");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Fill all required profile fields with valid data
    await page.fill('[data-testid="input-ragione-sociale"]', "Test Business");
    await page.fill('[data-testid="input-partita-iva"]', "12345678901");
    await page.fill('[data-testid="input-codice-fiscale"]', "TSTBSN80A01H501Z");
    await page.fill('[data-testid="input-codice-ateco"]', "62.01.00");
    await page.fill('[data-testid="input-indirizzo"]', "Via Test 1");
    await page.fill('[data-testid="input-cap"]', "00100");
    await page.fill('[data-testid="input-citta"]', "Roma");
    await page.fill('[data-testid="input-provincia"]', "RM");
    await page.fill('[data-testid="input-anno-inizio-attivita"]', "2020");

    // Submit the form
    await page.click('[data-testid="btn-submit-profile"]');

    // Toast notification should appear on success
    await expect(
      page.locator('[data-testid="toast"]')
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should show toast and inline error on profile validation failure", async ({
    page,
  }) => {
    await registerAndLogin(page, "toast-invalid");
    await page.goto("/settings");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Fill required fields but with an INVALID codiceFiscale
    await page.fill('[data-testid="input-ragione-sociale"]', "Test Business");
    await page.fill('[data-testid="input-partita-iva"]', "12345678901");
    await page.fill('[data-testid="input-codice-fiscale"]', "INVALID");
    await page.fill('[data-testid="input-codice-ateco"]', "62.01.00");
    await page.fill('[data-testid="input-indirizzo"]', "Via Test 1");
    await page.fill('[data-testid="input-cap"]', "00100");
    await page.fill('[data-testid="input-citta"]', "Roma");
    await page.fill('[data-testid="input-provincia"]', "RM");
    await page.fill('[data-testid="input-anno-inizio-attivita"]', "2020");

    // Submit the form
    await page.click('[data-testid="btn-submit-profile"]');

    // Destructive toast should appear
    await expect(
      page.locator('[data-testid="toast"]')
    ).toBeVisible({ timeout: 5_000 });

    // Inline validation error should appear next to the invalid field
    await expect(
      page.locator('[data-testid="field-error"]')
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should show toast on successful client creation", async ({ page }) => {
    await registerAndLogin(page, "toast-client");
    await page.goto("/clients");

    // Open new client dialog
    await page.click('[data-testid="btn-new-client"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill client form
    await page.fill('[data-testid="input-ragione-sociale"]', "Toast Test Srl");
    await page.fill('[data-testid="input-codice-fiscale"]', "99999999999");
    await page.fill('[data-testid="input-partita-iva"]', "99999999999");
    await page.fill('[data-testid="input-indirizzo"]', "Via Test 1");
    await page.fill('[data-testid="input-cap"]', "00100");
    await page.fill('[data-testid="input-citta"]', "Roma");
    await page.fill('[data-testid="input-provincia"]', "RM");

    // Submit
    await page.click('[data-testid="btn-submit-client"]');

    // Toast notification should appear on success
    await expect(
      page.locator('[data-testid="toast"]')
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

    // Open the actions dropdown menu (... button)
    await page.locator('[data-testid="actions-trigger"]').first().click();

    // Click Delete in the dropdown
    await page.locator('[role="menuitem"]').filter({ hasText: /delete|elimina/i }).click();

    // Confirm in alert dialog
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();
    await page.click('[data-testid="btn-confirm-delete"]');

    // Toast should appear with error
    await expect(
      page.locator('[data-testid="toast"]')
    ).toBeVisible({ timeout: 5_000 });
  });
});
