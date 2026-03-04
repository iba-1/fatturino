import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Client CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "clients");
  });

  test("should show empty state when no clients", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.locator("h1")).toContainText(/client/i);
    // Empty state should be visible
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should create a new business client (persona giuridica)", async ({ page }) => {
    await page.goto("/clients");

    // Click "New Client" button
    await page.click('[data-testid="btn-new-client"]');

    // Dialog should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill form — persona giuridica is default
    await page.fill('input[id="ragioneSociale"]', "Acme Srl");
    await page.fill('input[id="codiceFiscale"]', "12345678901");
    await page.fill('input[id="partitaIva"]', "12345678901");
    await page.fill('input[id="indirizzo"]', "Via Roma 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");

    // Submit
    await page.click('[role="dialog"] button[type="submit"]');

    // Dialog should close and client should appear in table
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("table")).toContainText("Acme Srl");
    await expect(page.locator("table")).toContainText("12345678901");
    await expect(page.locator("table")).toContainText("Roma");
  });

  test("should create a persona fisica client", async ({ page }) => {
    await page.goto("/clients");

    await page.click('[data-testid="btn-new-client"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Switch to persona fisica
    await page.click('[id="tipo"]');
    await page.click('[role="option"]:has-text("Persona Fisica"), [role="option"]:has-text("Individual")');

    // Fill persona fisica fields
    await page.fill('input[id="nome"]', "Mario");
    await page.fill('input[id="cognome"]', "Rossi");
    await page.fill('input[id="codiceFiscale"]', "RSSMRA80A01H501Z");
    await page.fill('input[id="indirizzo"]', "Via Milano 5");
    await page.fill('input[id="cap"]', "20100");
    await page.fill('input[id="citta"]', "Milano");
    await page.fill('input[id="provincia"]', "MI");

    await page.click('[role="dialog"] button[type="submit"]');

    await expect(page.locator('[role="dialog"]')).not.toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator("table")).toContainText("Mario Rossi");
  });

  test("should edit an existing client", async ({ page }) => {
    await page.goto("/clients");

    // First create a client
    await page.click('[data-testid="btn-new-client"]');
    await page.fill('input[id="ragioneSociale"]', "Old Name Srl");
    await page.fill('input[id="codiceFiscale"]', "98765432109");
    await page.fill('input[id="indirizzo"]', "Via Vecchia 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.click('[role="dialog"] button[type="submit"]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });

    // Click edit button (pencil icon)
    await page.click('[data-testid="btn-edit-client"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Change name
    await page.fill('input[id="ragioneSociale"]', "New Name Srl");
    await page.click('[role="dialog"] button[type="submit"]');

    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator("table")).toContainText("New Name Srl");
  });

  test("should delete a client with confirmation", async ({ page }) => {
    await page.goto("/clients");

    // Create a client first
    await page.click('[data-testid="btn-new-client"]');
    await page.fill('input[id="ragioneSociale"]', "Delete Me Srl");
    await page.fill('input[id="codiceFiscale"]', "11111111111");
    await page.fill('input[id="indirizzo"]', "Via Delete 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.click('[role="dialog"] button[type="submit"]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator("table")).toContainText("Delete Me Srl");

    // Click delete button
    await page.click('[data-testid="btn-delete-client"]');

    // Confirm dialog should appear
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();
    await expect(page.locator('[role="alertdialog"]')).toContainText("Delete Me Srl");

    // Confirm deletion — wait for the DELETE response
    const deleteResponse = page.waitForResponse(
      (res) => res.request().method() === "DELETE" && res.url().includes("/api/clients/")
    );
    await page.click('[data-testid="btn-confirm-delete"]');
    await deleteResponse;

    // Wait for the refetch of client list
    await page.waitForResponse(
      (res) => res.request().method() === "GET" && res.url().includes("/api/clients"),
      { timeout: 5_000 }
    );

    // Client should be gone
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 5_000 });
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/clients");

    await page.click('[data-testid="btn-new-client"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Submit without filling anything
    await page.click('[role="dialog"] button[type="submit"]');

    // Should show validation errors (multiple error messages)
    await expect(page.locator('[role="dialog"] .text-destructive').first()).toBeVisible();
  });
});
