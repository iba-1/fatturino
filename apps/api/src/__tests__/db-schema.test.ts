import { describe, it, expect } from "vitest";
import * as schema from "../db/schema.js";

/**
 * Tests that the DB schema exports all required tables and enums.
 * These are structural tests — they verify the schema is defined correctly
 * without needing a running database.
 */

describe("database schema exports", () => {
  it("should export all user-related tables", () => {
    expect(schema.users).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.accounts).toBeDefined();
    expect(schema.verifications).toBeDefined();
    expect(schema.userProfiles).toBeDefined();
  });

  it("should export client table", () => {
    expect(schema.clients).toBeDefined();
  });

  it("should export invoice tables", () => {
    expect(schema.invoices).toBeDefined();
    expect(schema.invoiceLines).toBeDefined();
  });

  it("should export tax-related tables", () => {
    expect(schema.taxPeriods).toBeDefined();
    expect(schema.inpsContributions).toBeDefined();
    expect(schema.f24Forms).toBeDefined();
  });

  it("should export enums", () => {
    expect(schema.tipoClienteEnum).toBeDefined();
    expect(schema.statoFatturaEnum).toBeDefined();
    expect(schema.tipoDocumentoEnum).toBeDefined();
    expect(schema.gestioneInpsEnum).toBeDefined();
    expect(schema.tipoF24Enum).toBeDefined();
  });
});
