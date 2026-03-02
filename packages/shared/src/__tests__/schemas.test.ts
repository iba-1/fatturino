import { describe, it, expect } from "vitest";
import {
  createUserProfileSchema,
  createClientSchema,
  createInvoiceSchema,
  createInvoiceLineSchema,
  statoFatturaSchema,
  tipoDocumentoSchema,
  tipoClienteSchema,
} from "../schemas/index.js";

describe("createUserProfileSchema", () => {
  const validProfile = {
    ragioneSociale: "Mario Rossi",
    partitaIva: "12345678901",
    codiceFiscale: "RSSMRA85M01H501Z",
    codiceAteco: "62.01",
    indirizzo: "Via Roma 1",
    cap: "00100",
    citta: "Roma",
    provincia: "RM",
    annoInizioAttivita: 2020,
  };

  it("should accept a valid profile", () => {
    const result = createUserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("should set default regime fiscale to RF19", () => {
    const result = createUserProfileSchema.parse(validProfile);
    expect(result.regimeFiscale).toBe("RF19");
  });

  it("should reject invalid partita IVA (not 11 digits)", () => {
    const result = createUserProfileSchema.safeParse({
      ...validProfile,
      partitaIva: "123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid codice fiscale format", () => {
    const result = createUserProfileSchema.safeParse({
      ...validProfile,
      codiceFiscale: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid CAP (not 5 digits)", () => {
    const result = createUserProfileSchema.safeParse({
      ...validProfile,
      cap: "123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid provincia (not 2 characters)", () => {
    const result = createUserProfileSchema.safeParse({
      ...validProfile,
      provincia: "ROM",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional PEC and codice SDI", () => {
    const result = createUserProfileSchema.safeParse({
      ...validProfile,
      pec: "mario@pec.it",
      codiceSdi: "ABCDEFG",
    });
    expect(result.success).toBe(true);
  });

  it("should reject codice SDI that is not 7 characters", () => {
    const result = createUserProfileSchema.safeParse({
      ...validProfile,
      codiceSdi: "ABC",
    });
    expect(result.success).toBe(false);
  });
});

describe("createClientSchema", () => {
  const validClient = {
    tipo: "persona_giuridica" as const,
    ragioneSociale: "Acme Srl",
    codiceFiscale: "12345678901",
    indirizzo: "Via Milano 10",
    cap: "20100",
    citta: "Milano",
    provincia: "MI",
  };

  it("should accept a valid client", () => {
    const result = createClientSchema.safeParse(validClient);
    expect(result.success).toBe(true);
  });

  it("should default nazione to IT", () => {
    const result = createClientSchema.parse(validClient);
    expect(result.nazione).toBe("IT");
  });

  it("should reject invalid tipo", () => {
    const result = createClientSchema.safeParse({
      ...validClient,
      tipo: "azienda",
    });
    expect(result.success).toBe(false);
  });
});

describe("createInvoiceSchema", () => {
  const validInvoice = {
    clientId: "550e8400-e29b-41d4-a716-446655440000",
    dataEmissione: "2024-01-15",
    lines: [
      {
        descrizione: "Consulenza software",
        quantita: 10,
        prezzoUnitario: 50,
      },
    ],
  };

  it("should accept a valid invoice", () => {
    const result = createInvoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it("should default tipoDocumento to TD01", () => {
    const result = createInvoiceSchema.parse(validInvoice);
    expect(result.tipoDocumento).toBe("TD01");
  });

  it("should require at least one line", () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      lines: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid date format", () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      dataEmissione: "15/01/2024",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid clientId (not UUID)", () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      clientId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("createInvoiceLineSchema", () => {
  it("should accept a valid line", () => {
    const result = createInvoiceLineSchema.safeParse({
      descrizione: "Sviluppo web",
      quantita: 5,
      prezzoUnitario: 100,
    });
    expect(result.success).toBe(true);
  });

  it("should default aliquotaIva to 0 and naturaIva to N2.2", () => {
    const result = createInvoiceLineSchema.parse({
      descrizione: "Sviluppo web",
      quantita: 5,
      prezzoUnitario: 100,
    });
    expect(result.aliquotaIva).toBe(0);
    expect(result.naturaIva).toBe("N2.2");
  });

  it("should reject quantita <= 0", () => {
    const result = createInvoiceLineSchema.safeParse({
      descrizione: "Test",
      quantita: 0,
      prezzoUnitario: 100,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative prezzoUnitario", () => {
    const result = createInvoiceLineSchema.safeParse({
      descrizione: "Test",
      quantita: 1,
      prezzoUnitario: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe("enum schemas", () => {
  it("should validate stato fattura values", () => {
    expect(statoFatturaSchema.safeParse("bozza").success).toBe(true);
    expect(statoFatturaSchema.safeParse("inviata").success).toBe(true);
    expect(statoFatturaSchema.safeParse("invalid").success).toBe(false);
  });

  it("should validate tipo documento values", () => {
    expect(tipoDocumentoSchema.safeParse("TD01").success).toBe(true);
    expect(tipoDocumentoSchema.safeParse("TD06").success).toBe(true);
    expect(tipoDocumentoSchema.safeParse("TD99").success).toBe(false);
  });

  it("should validate tipo cliente values", () => {
    expect(tipoClienteSchema.safeParse("persona_fisica").success).toBe(true);
    expect(tipoClienteSchema.safeParse("persona_giuridica").success).toBe(true);
    expect(tipoClienteSchema.safeParse("azienda").success).toBe(false);
  });
});
