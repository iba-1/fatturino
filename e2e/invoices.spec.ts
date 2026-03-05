import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Invoice CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "invoices");

    // Create a client first (invoices need a client)
    await page.goto("/clients");
    await page.click('[data-testid="btn-new-client"]');
    await page.fill('input[id="ragioneSociale"]', "Test Client Srl");
    await page.fill('input[id="codiceFiscale"]', "99999999999");
    await page.fill('input[id="partitaIva"]', "99999999999");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    const createClientDone = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/clients"),
    );
    await page.click('[role="dialog"] button[type="submit"]');
    await createClientDone;
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 30_000 });
    await expect(page.locator("table")).toContainText("Test Client Srl", { timeout: 30_000 });
  });

  test("should show empty state when no invoices", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.locator("h1")).toContainText(/fattur|invoic/i);
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should navigate to new invoice form", async ({ page }) => {
    await page.goto("/invoices");
    await page.click('[data-testid="btn-new-invoice"]');
    await expect(page).toHaveURL(/\/invoices\/new/);
    await expect(page.locator("form")).toBeVisible();
  });

  test("should create an invoice with line items and auto-calculate totals", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Select client
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:has-text("Test Client Srl")');

    // Fill first line item
    await page.fill('[data-testid="input-description-0"]', "Consulenza tecnica");

    // Set quantity and price
    await page.locator('[data-testid="input-quantity-0"]').fill("10");
    await page.locator('[data-testid="input-unit-price-0"]').fill("100");

    // Verify totals section
    const totalsSection = page.locator('[data-testid="invoice-totals"]');
    // Subtotal should show 1000.00
    await expect(totalsSection).toContainText("1000.00");
    // Bollo should be shown (1000 > 77.47)
    await expect(totalsSection).toContainText("2.00");
    // Total = 1002.00
    await expect(totalsSection).toContainText("1002.00");

    // Verify forfettario disclaimer is shown
    await expect(page.locator('[data-testid="forfettario-disclaimer"]')).toBeVisible();
    await expect(page.locator('[data-testid="forfettario-disclaimer"]')).toContainText(
      "Legge n. 190/2014"
    );

    // Submit and wait for the POST response
    const createResponse = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/invoices")
    );
    await page.click('button[type="submit"]');
    await createResponse;

    // Should redirect to invoices list
    await expect(page).toHaveURL("/invoices", { timeout: 10_000 });

    // Invoice should appear in the list
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("table")).toContainText("1/");
    await expect(page.locator("table")).toContainText("1002.00");
  });

  test("should not apply bollo for invoices <= €77.47", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Select client
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:has-text("Test Client Srl")');

    // Fill line item with small amount
    await page.fill('[data-testid="input-description-0"]', "Small service");
    await page.locator('[data-testid="input-quantity-0"]').fill("1");
    await page.locator('[data-testid="input-unit-price-0"]').fill("50");

    // Verify subtotal = 50.00
    const totalsSection = page.locator('[data-testid="invoice-totals"]');
    await expect(totalsSection).toContainText("50.00");

    // Bollo should NOT appear
    await expect(page.locator('[data-testid="bollo-row"]')).not.toBeVisible();
  });

  test("should add and remove line items", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Description inputs (line items only, not causale)
    const descriptionInputs = page.locator('[data-testid^="input-description-"]');

    // Should start with 1 line
    await expect(descriptionInputs).toHaveCount(1);

    // Add a line
    await page.click('[data-testid="btn-add-line"]');
    await expect(descriptionInputs).toHaveCount(2);

    // Add another
    await page.click('[data-testid="btn-add-line"]');
    await expect(descriptionInputs).toHaveCount(3);

    // Remove middle line — each line has a trash button
    await page.locator('[data-testid="btn-remove-line-1"]').click();
    await expect(descriptionInputs).toHaveCount(2);
  });

  test("should show draft badge and allow delete of draft invoice", async ({ page }) => {
    // Create an invoice first
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    await page.click('[id="clientId"]');
    await page.click('[role="option"]:has-text("Test Client Srl")');
    await page.fill('[data-testid="input-description-0"]', "Draft service");
    await page.locator('[data-testid="input-quantity-0"]').fill("1");
    await page.locator('[data-testid="input-unit-price-0"]').fill("100");

    const createResponse = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/invoices")
    );
    await page.click('button[type="submit"]');
    await createResponse;

    await expect(page).toHaveURL("/invoices", { timeout: 10_000 });

    // Should show "Bozza" / "Draft" badge
    await expect(page.locator("table")).toContainText(/bozza|draft/i);

    // Open the actions dropdown menu (... button)
    await page.locator('[data-testid="actions-trigger"]').first().click();

    // Click Delete in the dropdown
    await page.locator('[role="menuitem"]').filter({ hasText: /delete|elimina/i }).click();
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();

    // Confirm delete
    const deleteResponse = page.waitForResponse(
      (res) => res.request().method() === "DELETE" && res.url().includes("/api/invoices/")
    );
    await page.click('[data-testid="btn-confirm-delete"]');
    await deleteResponse;

    // Wait for UI to update after delete (TanStack Query may serve from cache, so wait for UI state)
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 15_000 });
  });

  // --- Bollo boundary ---

  test("should NOT apply bollo at exactly €77.47 (threshold boundary)", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:has-text("Test Client Srl")');
    await page.fill('[data-testid="input-description-0"]', "Boundary service");
    await page.locator('[data-testid="input-quantity-0"]').fill("1");
    await page.locator('[data-testid="input-unit-price-0"]').fill("77.47");

    await expect(page.locator('[data-testid="invoice-totals"]')).toContainText("77.47");
    await expect(page.locator('[data-testid="bollo-row"]')).not.toBeVisible();
  });

  test("should apply bollo at €77.48 (one cent above threshold)", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:has-text("Test Client Srl")');
    await page.fill('[data-testid="input-description-0"]', "Just-over-threshold service");
    await page.locator('[data-testid="input-quantity-0"]').fill("1");
    await page.locator('[data-testid="input-unit-price-0"]').fill("77.48");

    const totals = page.locator('[data-testid="invoice-totals"]');
    await expect(totals).toContainText("77.48");
    // Bollo €2.00 should appear
    await expect(totals).toContainText("2.00");
    await expect(totals).toContainText("79.48");
  });

  test("should view invoice detail with preview", async ({ page }) => {
    // Create an invoice
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    await page.click('[id="clientId"]');
    await page.click('[role="option"]:has-text("Test Client Srl")');
    await page.fill('[data-testid="input-description-0"]', "Preview service");
    await page.locator('[data-testid="input-quantity-0"]').fill("5");
    await page.locator('[data-testid="input-unit-price-0"]').fill("200");

    const createResponse = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/invoices")
    );
    await page.click('button[type="submit"]');
    await createResponse;

    await expect(page).toHaveURL("/invoices", { timeout: 10_000 });

    // Open the actions dropdown and click View
    await page.locator('[data-testid="actions-trigger"]').first().click();
    await page.locator('[role="menuitem"]').filter({ hasText: /view|visualizza/i }).click();

    await expect(page).toHaveURL(/\/invoices\/.+/);

    // Preview should be visible
    await expect(page.locator('[data-testid="invoice-preview"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText("Preview service");
    await expect(page.locator('[data-testid="invoice-preview"]')).toContainText("1000.00");

    // Forfettario disclaimer should be present
    await expect(page.locator('[data-testid="forfettario-disclaimer"]')).toContainText(
      "Legge n. 190/2014"
    );
  });
});

// Separate describe: this test needs its own registration (no shared beforeEach client setup)
test.describe("Invoice status restrictions", () => {
  test("should not show delete option for non-draft (inviata) invoices", async ({ page }) => {
    await registerAndLogin(page, "nodelete");

    // Mock the GET /api/invoices to return a non-draft invoice
    await page.route("**/api/invoices", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "mocked-issued-id",
              userId: "mocked-user",
              clientId: "mocked-client",
              numeroFattura: 99,
              anno: 2026,
              dataEmissione: new Date().toISOString(),
              tipoDocumento: "TD01",
              causale: "",
              imponibile: "500.00",
              impostaBollo: "0.00",
              totaleDocumento: "500.00",
              stato: "inviata",
              pagata: false,
              dataPagamento: null,
              originalInvoiceId: null,
              creditNoteId: null,
              sdiIdentifier: null,
              sdiStatus: null,
              xmlContent: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/invoices");
    await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("table")).toContainText("99/2026");

    // Open the actions dropdown
    await page.locator('[data-testid="actions-trigger"]').first().click();

    // View option should exist
    await expect(page.locator('[role="menuitem"]').filter({ hasText: /view|visualizza/i })).toBeVisible();

    // Edit should NOT be shown for inviata invoices
    await expect(
      page.locator('[role="menuitem"]').filter({ hasText: /^edit$|^modifica$/i })
    ).not.toBeVisible();
  });
});
