import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

/**
 * Helper: fill and submit the profile form on the Settings page.
 */
async function fillProfile(page: import("@playwright/test").Page) {
  await page.goto("/settings");
  await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

  await page.fill('[data-testid="input-ragione-sociale"]', "Mario Rossi Freelance");
  await page.fill('[data-testid="input-partita-iva"]', "12345678901");
  await page.fill('[data-testid="input-codice-fiscale"]', "RSSMRA85M01H501Z");
  await page.fill('[data-testid="input-codice-ateco"]', "62.01.00");
  await page.fill('[data-testid="input-indirizzo"]', "Via Roma 10");
  await page.fill('[data-testid="input-cap"]', "00100");
  await page.fill('[data-testid="input-citta"]', "Roma");
  await page.fill('[data-testid="input-provincia"]', "RM");

  const saveResponse = page.waitForResponse(
    (res) => res.url().includes("/api/profile") && res.status() < 400,
  );
  await page.click('[data-testid="btn-submit-profile"]');
  await saveResponse;
}

test.describe.serial("Invoice XML/PDF download flow", () => {
  // beforeEach creates client + invoice + navigates to detail — needs extra time on CI
  test.setTimeout(60_000);

  /** ID extracted from the URL after creating the invoice. */
  let invoiceId: string;

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "xml");

    // --- Create a test client ---
    await page.goto("/clients");
    await page.click('[data-testid="btn-new-client"]');
    await page.fill('[data-testid="input-ragione-sociale"]', "XML Test Client Srl");
    await page.fill('[data-testid="input-codice-fiscale"]', "99999999999");
    await page.fill('[data-testid="input-partita-iva"]', "99999999999");
    await page.fill('[data-testid="input-indirizzo"]', "Via Test 1");
    await page.fill('[data-testid="input-cap"]', "00100");
    await page.fill('[data-testid="input-citta"]', "Roma");
    await page.fill('[data-testid="input-provincia"]', "RM");
    await page.fill('[data-testid="input-codice-sdi"]', "ABCDEFG");
    const createClientDone = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/clients"),
    );
    await page.click('[data-testid="btn-submit-client"]');
    await createClientDone;
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 30_000 });
    await expect(page.locator("table")).toContainText("XML Test Client Srl", { timeout: 30_000 });

    // --- Create a test invoice ---
    await page.goto("/invoices/new");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Select client
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:has-text("XML Test Client Srl")');

    // Fill line item
    await page.fill('[data-testid="input-description-0"]', "Consulenza XML");
    await page.locator('[data-testid="input-quantity-0"]').fill("10");
    await page.locator('[data-testid="input-unit-price-0"]').fill("100");

    // Submit
    const createResponse = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/api/invoices"),
    );
    await page.click('[data-testid="btn-submit-invoice"]');
    await createResponse;

    await expect(page).toHaveURL("/invoices", { timeout: 10_000 });

    // Wait for the table to render the invoice row before opening dropdown
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Navigate to the created invoice detail — open dropdown then click View
    await page.locator('[data-testid="actions-trigger"]').first().click();
    await page.locator('[role="menuitem"]').filter({ hasText: /view|visualizza/i }).click();
    await expect(page).toHaveURL(/\/invoices\/.+/);

    // Extract the invoice ID from the URL
    const url = page.url();
    invoiceId = url.split("/invoices/")[1];
  });

  test("should show missing profile banner when profile not set", async ({ page }) => {
    // The invoice detail page should already be visible from beforeEach
    await expect(page.locator('[data-testid="missing-profile-banner"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('[data-testid="missing-profile-banner"]')).toContainText(
      "Complete your profile",
    );
    // Should contain a link to settings
    await expect(
      page.locator('[data-testid="missing-profile-banner"] a[href="/settings"]'),
    ).toBeVisible();
  });

  test("should complete profile setup via Settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    await page.fill('[data-testid="input-ragione-sociale"]', "Mario Rossi Freelance");
    await page.fill('[data-testid="input-partita-iva"]', "12345678901");
    await page.fill('[data-testid="input-codice-fiscale"]', "RSSMRA85M01H501Z");
    await page.fill('[data-testid="input-codice-ateco"]', "62.01.00");
    await page.fill('[data-testid="input-indirizzo"]', "Via Roma 10");
    await page.fill('[data-testid="input-cap"]', "00100");
    await page.fill('[data-testid="input-citta"]', "Roma");
    await page.fill('[data-testid="input-provincia"]', "RM");

    const saveResponse = page.waitForResponse(
      (res) => res.url().includes("/api/profile") && res.status() < 400,
    );
    await page.click('[data-testid="btn-submit-profile"]');
    await saveResponse;

    // After save, the form should still be filled (profile persisted)
    await expect(page.locator('[data-testid="input-ragione-sociale"]')).toHaveValue("Mario Rossi Freelance");
    await expect(page.locator('[data-testid="input-partita-iva"]')).toHaveValue("12345678901");
  });

  test("should validate invoice successfully after profile is set", async ({ page }) => {
    // Set up profile first
    await fillProfile(page);

    // Navigate back to invoice detail
    await page.goto(`/invoices/${invoiceId}`);
    await expect(page.locator('[data-testid="invoice-preview"]')).toBeVisible({ timeout: 5_000 });

    // Missing profile banner should NOT appear now
    await expect(page.locator('[data-testid="missing-profile-banner"]')).not.toBeVisible();

    // Click Validate
    const validateResponse = page.waitForResponse(
      (res) => res.url().includes(`/api/invoices/${invoiceId}/xml/validate`) && res.status() === 200,
    );
    await page.click('[data-testid="btn-validate"]');
    await validateResponse;

    // Should see validation success message
    await expect(page.locator("text=Invoice valid")).toBeVisible({ timeout: 5_000 });
  });

  test("should download XML after successful validation", async ({ page }) => {
    await fillProfile(page);

    await page.goto(`/invoices/${invoiceId}`);
    await expect(page.locator('[data-testid="invoice-preview"]')).toBeVisible({ timeout: 5_000 });

    // Click Download XML and intercept the response
    const xmlResponse = page.waitForResponse(
      (res) => res.url().includes(`/api/invoices/${invoiceId}/xml`) &&
        !res.url().includes("/validate") &&
        res.request().method() === "GET",
    );
    await page.click('[data-testid="btn-download-xml"]');
    const response = await xmlResponse;

    // Verify response content type
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/xml");
    expect(response.status()).toBe(200);
  });

  test("should download PDF", async ({ page }) => {
    await fillProfile(page);

    await page.goto(`/invoices/${invoiceId}`);
    await expect(page.locator('[data-testid="invoice-preview"]')).toBeVisible({ timeout: 5_000 });

    // Click Download PDF and intercept the response
    const pdfResponse = page.waitForResponse(
      (res) => res.url().includes(`/api/invoices/${invoiceId}/pdf`) &&
        res.request().method() === "GET",
    );
    await page.click('[data-testid="btn-download-pdf"]');
    const response = await pdfResponse;

    // Verify response content type
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/pdf");
    expect(response.status()).toBe(200);
  });
});
