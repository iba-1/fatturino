import { describe, it, expect } from "vitest";
import it_translations from "../i18n/it.json";
import en_translations from "../i18n/en.json";

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n translations", () => {
  const itKeys = getKeys(it_translations);
  const enKeys = getKeys(en_translations);

  it("should have Italian translations", () => {
    expect(itKeys.length).toBeGreaterThan(0);
  });

  it("should have English translations", () => {
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it("should have the same keys in both languages", () => {
    const missingInEn = itKeys.filter((k) => !enKeys.includes(k));
    const missingInIt = enKeys.filter((k) => !itKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInIt).toEqual([]);
  });

  it("should include core navigation keys", () => {
    expect(itKeys).toContain("nav.dashboard");
    expect(itKeys).toContain("nav.invoices");
    expect(itKeys).toContain("nav.clients");
    expect(itKeys).toContain("nav.taxes");
    expect(itKeys).toContain("nav.settings");
  });

  it("should include auth keys", () => {
    expect(itKeys).toContain("auth.login");
    expect(itKeys).toContain("auth.register");
    expect(itKeys).toContain("auth.email");
    expect(itKeys).toContain("auth.password");
  });
});
