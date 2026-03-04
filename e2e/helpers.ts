import type { Page } from "@playwright/test";

/**
 * Register a new user and return to the dashboard (authenticated).
 * Uses a unique email per call to avoid conflicts.
 */
export async function registerAndLogin(page: Page, prefix = "e2e") {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;
  const password = "Test1234!@";
  const name = "E2E Tester";

  await page.goto("/register");
  await page.fill('input[id="name"]', name);
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);

  const registerResponse = page.waitForResponse(
    (res) =>
      res.request().method() === "POST" &&
      res.url().includes("/api/auth/sign-up") &&
      res.status() === 200,
  );
  await page.click('button[type="submit"]');
  await registerResponse;

  // Wait for dashboard — generous timeout for CI with parallel workers
  await page.waitForURL("/", { timeout: 30_000 });

  return { email, password, name };
}
