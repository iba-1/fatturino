import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should register a new user and redirect to dashboard", async ({ page }) => {
    const email = `e2e-reg-${Date.now()}@test.com`;

    await page.goto("/register");
    await expect(page.locator("h1")).toBeVisible();

    await page.fill('input[id="name"]', "Test User");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', "Test1234!@");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL("/", { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText(/dashboard/i);
  });

  test("should login with existing user", async ({ page }) => {
    const email = `e2e-login-${Date.now()}@test.com`;

    // First register
    await page.goto("/register");
    await page.fill('input[id="name"]', "Login Test");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', "Test1234!@");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10_000 });

    // Logout by clearing cookies and go to login
    await page.context().clearCookies();
    await page.goto("/login");
    await expect(page.locator("h1")).toBeVisible();

    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', "Test1234!@");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/", { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText(/dashboard/i);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[id="email"]', "nonexistent@test.com");
    await page.fill('input[id="password"]', "WrongPass123!");
    await page.click('button[type="submit"]');

    // Error div with data-testid
    const errorDiv = page.locator('[data-testid="auth-error"]');
    await expect(errorDiv).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
