# Phase 3: FatturaPA XML + PDF Export — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate compliant FatturaPA XML files (TD01/TD04) with validation and PDF export, plus CI/CD with GitHub Actions.

**Architecture:** Hybrid approach — `packages/fattura-xml` handles pure XML building + validation (no I/O), API layer orchestrates data fetching and PDF generation via Playwright. GitHub Actions runs the full test suite on every PR.

**Tech Stack:** TypeScript, `fast-xml-parser` (XML building), `libxmljs2` (XSD validation), Playwright (PDF), GitHub Actions (CI)

---

### Task 1: Bootstrap `packages/fattura-xml` Package

**Files:**
- Create: `packages/fattura-xml/package.json`
- Create: `packages/fattura-xml/tsconfig.json`
- Create: `packages/fattura-xml/src/index.ts`
- Create: `packages/fattura-xml/vitest.config.ts`

**Step 1: Create package.json**

```json
{
  "name": "@fatturino/fattura-xml",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fatturino/shared": "workspace:*",
    "fast-xml-parser": "^4.5.0",
    "libxmljs2": "^0.35.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

**Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

**Step 4: Create src/index.ts (empty barrel)**

```ts
// FatturaPA XML builder and validator
```

**Step 5: Install dependencies and verify**

Run: `cd /Users/iba/Freelance/fatturino && pnpm install`
Expected: Dependencies installed, workspace resolves `@fatturino/fattura-xml`

Run: `pnpm --filter @fatturino/fattura-xml type-check`
Expected: No errors

**Step 6: Commit**

```bash
git add packages/fattura-xml/
git commit -m "feat(fattura-xml): bootstrap package with dependencies"
```

---

### Task 2: Define FatturaPA Input Types

**Files:**
- Create: `packages/fattura-xml/src/types.ts`
- Create: `packages/fattura-xml/src/__tests__/types.test.ts`

**Step 1: Write the test**

```ts
// packages/fattura-xml/src/__tests__/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  CedenteData,
  CessionarioData,
  DatiGeneraliData,
  DettaglioLineaData,
  FatturaInput,
} from "../types.js";

describe("FatturaPA types", () => {
  it("should allow constructing a valid FatturaInput", () => {
    const input: FatturaInput = {
      cedente: {
        partitaIva: "01234567890",
        codiceFiscale: "RSSMRA85M01H501Z",
        ragioneSociale: "Mario Rossi",
        regimeFiscale: "RF19",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
        nazione: "IT",
      },
      cessionario: {
        tipo: "persona_giuridica",
        partitaIva: "09876543210",
        codiceFiscale: "09876543210",
        ragioneSociale: "Acme S.r.l.",
        indirizzo: "Via Milano 10",
        cap: "20100",
        citta: "Milano",
        provincia: "MI",
        nazione: "IT",
        codiceSdi: "ABCDEFG",
      },
      datiGenerali: {
        tipoDocumento: "TD01",
        divisa: "EUR",
        data: "2026-03-02",
        numero: "1",
        causale: "Consulenza informatica",
        importoBollo: 2.0,
      },
      linee: [
        {
          numeroLinea: 1,
          descrizione: "Consulenza informatica marzo 2026",
          quantita: 1,
          prezzoUnitario: 1000.0,
          prezzoTotale: 1000.0,
          aliquotaIva: 0,
          natura: "N2.2",
        },
      ],
    };

    expect(input.cedente.partitaIva).toBe("01234567890");
    expect(input.linee).toHaveLength(1);
    expect(input.datiGenerali.tipoDocumento).toBe("TD01");
  });

  it("should allow persona_fisica cessionario without partitaIva", () => {
    const cessionario: CessionarioData = {
      tipo: "persona_fisica",
      codiceFiscale: "BNCLRA90A41F205X",
      nome: "Laura",
      cognome: "Bianchi",
      indirizzo: "Via Napoli 5",
      cap: "80100",
      citta: "Napoli",
      provincia: "NA",
      nazione: "IT",
      codiceSdi: "0000000",
      pec: "laura@pec.it",
    };

    expect(cessionario.partitaIva).toBeUndefined();
    expect(cessionario.nome).toBe("Laura");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: FAIL — cannot find module `../types.js`

**Step 3: Write the types**

```ts
// packages/fattura-xml/src/types.ts

export interface CedenteData {
  partitaIva: string;
  codiceFiscale: string;
  ragioneSociale: string;
  regimeFiscale: string; // "RF19" for forfettario
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione: string; // "IT"
}

export interface CessionarioData {
  tipo: "persona_fisica" | "persona_giuridica";
  partitaIva?: string;
  codiceFiscale: string;
  ragioneSociale?: string;
  nome?: string;
  cognome?: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione: string;
  codiceSdi?: string;
  pec?: string;
}

export interface DatiGeneraliData {
  tipoDocumento: string; // "TD01" | "TD04"
  divisa: string; // "EUR"
  data: string; // "YYYY-MM-DD"
  numero: string; // progressive number as string
  causale?: string;
  importoBollo?: number; // 2.00 when applicable
}

export interface DettaglioLineaData {
  numeroLinea: number;
  descrizione: string;
  quantita: number;
  prezzoUnitario: number;
  prezzoTotale: number;
  aliquotaIva: number; // 0 for forfettario
  natura?: string; // "N2.2" for forfettario
}

export interface FatturaInput {
  cedente: CedenteData;
  cessionario: CessionarioData;
  datiGenerali: DatiGeneraliData;
  linee: DettaglioLineaData[];
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add packages/fattura-xml/src/types.ts packages/fattura-xml/src/__tests__/types.test.ts
git commit -m "feat(fattura-xml): define FatturaPA input types"
```

---

### Task 3: Build XML Header Section

**Files:**
- Create: `packages/fattura-xml/src/sections/header.ts`
- Create: `packages/fattura-xml/src/__tests__/header.test.ts`

**Step 1: Write the failing test**

```ts
// packages/fattura-xml/src/__tests__/header.test.ts
import { describe, it, expect } from "vitest";
import { buildHeader } from "../sections/header.js";
import type { CedenteData, CessionarioData } from "../types.js";

const cedente: CedenteData = {
  partitaIva: "01234567890",
  codiceFiscale: "RSSMRA85M01H501Z",
  ragioneSociale: "Mario Rossi",
  regimeFiscale: "RF19",
  indirizzo: "Via Roma 1",
  cap: "00100",
  citta: "Roma",
  provincia: "RM",
  nazione: "IT",
};

const cessionarioPG: CessionarioData = {
  tipo: "persona_giuridica",
  partitaIva: "09876543210",
  codiceFiscale: "09876543210",
  ragioneSociale: "Acme S.r.l.",
  indirizzo: "Via Milano 10",
  cap: "20100",
  citta: "Milano",
  provincia: "MI",
  nazione: "IT",
  codiceSdi: "ABCDEFG",
};

const cessionarioPF: CessionarioData = {
  tipo: "persona_fisica",
  codiceFiscale: "BNCLRA90A41F205X",
  nome: "Laura",
  cognome: "Bianchi",
  indirizzo: "Via Napoli 5",
  cap: "80100",
  citta: "Napoli",
  provincia: "NA",
  nazione: "IT",
  codiceSdi: "0000000",
  pec: "laura@pec.it",
};

describe("buildHeader", () => {
  it("should build DatiTrasmissione with codice SDI", () => {
    const header = buildHeader(cedente, cessionarioPG);
    const dt = header.DatiTrasmissione;

    expect(dt.IdTrasmittente.IdPaese).toBe("IT");
    expect(dt.IdTrasmittente.IdCodice).toBe("01234567890");
    expect(dt.FormatoTrasmissione).toBe("FPR12");
    expect(dt.CodiceDestinatario).toBe("ABCDEFG");
  });

  it("should set CodiceDestinatario to 0000000 and add PEC when no SDI code", () => {
    const header = buildHeader(cedente, cessionarioPF);
    const dt = header.DatiTrasmissione;

    expect(dt.CodiceDestinatario).toBe("0000000");
    expect(dt.PECDestinatario).toBe("laura@pec.it");
  });

  it("should build CedentePrestatore with correct data", () => {
    const header = buildHeader(cedente, cessionarioPG);
    const cp = header.CedentePrestatore;

    expect(cp.DatiAnagrafici.IdFiscaleIVA.IdPaese).toBe("IT");
    expect(cp.DatiAnagrafici.IdFiscaleIVA.IdCodice).toBe("01234567890");
    expect(cp.DatiAnagrafici.CodiceFiscale).toBe("RSSMRA85M01H501Z");
    expect(cp.DatiAnagrafici.Anagrafica.Denominazione).toBe("Mario Rossi");
    expect(cp.DatiAnagrafici.RegimeFiscale).toBe("RF19");
    expect(cp.Sede.Indirizzo).toBe("Via Roma 1");
    expect(cp.Sede.CAP).toBe("00100");
    expect(cp.Sede.Comune).toBe("Roma");
    expect(cp.Sede.Provincia).toBe("RM");
    expect(cp.Sede.Nazione).toBe("IT");
  });

  it("should build CessionarioCommittente for persona_giuridica", () => {
    const header = buildHeader(cedente, cessionarioPG);
    const cc = header.CessionarioCommittente;

    expect(cc.DatiAnagrafici.IdFiscaleIVA?.IdCodice).toBe("09876543210");
    expect(cc.DatiAnagrafici.Anagrafica.Denominazione).toBe("Acme S.r.l.");
    expect(cc.DatiAnagrafici.Anagrafica.Nome).toBeUndefined();
  });

  it("should build CessionarioCommittente for persona_fisica", () => {
    const header = buildHeader(cedente, cessionarioPF);
    const cc = header.CessionarioCommittente;

    expect(cc.DatiAnagrafici.IdFiscaleIVA).toBeUndefined();
    expect(cc.DatiAnagrafici.CodiceFiscale).toBe("BNCLRA90A41F205X");
    expect(cc.DatiAnagrafici.Anagrafica.Nome).toBe("Laura");
    expect(cc.DatiAnagrafici.Anagrafica.Cognome).toBe("Bianchi");
    expect(cc.DatiAnagrafici.Anagrafica.Denominazione).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: FAIL — cannot find module `../sections/header.js`

**Step 3: Implement buildHeader**

```ts
// packages/fattura-xml/src/sections/header.ts
import type { CedenteData, CessionarioData } from "../types.js";

export function buildHeader(cedente: CedenteData, cessionario: CessionarioData) {
  return {
    DatiTrasmissione: buildDatiTrasmissione(cedente, cessionario),
    CedentePrestatore: buildCedentePrestatore(cedente),
    CessionarioCommittente: buildCessionarioCommittente(cessionario),
  };
}

function buildDatiTrasmissione(cedente: CedenteData, cessionario: CessionarioData) {
  const dt: Record<string, unknown> = {
    IdTrasmittente: {
      IdPaese: "IT",
      IdCodice: cedente.partitaIva,
    },
    FormatoTrasmissione: "FPR12",
    CodiceDestinatario: cessionario.codiceSdi || "0000000",
  };

  if (!cessionario.codiceSdi || cessionario.codiceSdi === "0000000") {
    if (cessionario.pec) {
      dt.PECDestinatario = cessionario.pec;
    }
  }

  return dt;
}

function buildCedentePrestatore(cedente: CedenteData) {
  return {
    DatiAnagrafici: {
      IdFiscaleIVA: {
        IdPaese: cedente.nazione,
        IdCodice: cedente.partitaIva,
      },
      CodiceFiscale: cedente.codiceFiscale,
      Anagrafica: {
        Denominazione: cedente.ragioneSociale,
      },
      RegimeFiscale: cedente.regimeFiscale,
    },
    Sede: {
      Indirizzo: cedente.indirizzo,
      CAP: cedente.cap,
      Comune: cedente.citta,
      Provincia: cedente.provincia,
      Nazione: cedente.nazione,
    },
  };
}

function buildCessionarioCommittente(cessionario: CessionarioData) {
  const anagrafica: Record<string, string> = {};

  if (cessionario.tipo === "persona_giuridica") {
    anagrafica.Denominazione = cessionario.ragioneSociale!;
  } else {
    anagrafica.Nome = cessionario.nome!;
    anagrafica.Cognome = cessionario.cognome!;
  }

  const datiAnagrafici: Record<string, unknown> = {
    Anagrafica: anagrafica,
    CodiceFiscale: cessionario.codiceFiscale,
  };

  if (cessionario.partitaIva) {
    datiAnagrafici.IdFiscaleIVA = {
      IdPaese: cessionario.nazione,
      IdCodice: cessionario.partitaIva,
    };
  }

  return {
    DatiAnagrafici: datiAnagrafici,
    Sede: {
      Indirizzo: cessionario.indirizzo,
      CAP: cessionario.cap,
      Comune: cessionario.citta,
      Provincia: cessionario.provincia,
      Nazione: cessionario.nazione,
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: PASS (all header tests)

**Step 5: Commit**

```bash
git add packages/fattura-xml/src/sections/header.ts packages/fattura-xml/src/__tests__/header.test.ts
git commit -m "feat(fattura-xml): build FatturaPA header section"
```

---

### Task 4: Build XML Body Section

**Files:**
- Create: `packages/fattura-xml/src/sections/body.ts`
- Create: `packages/fattura-xml/src/__tests__/body.test.ts`

**Step 1: Write the failing test**

```ts
// packages/fattura-xml/src/__tests__/body.test.ts
import { describe, it, expect } from "vitest";
import { buildBody } from "../sections/body.js";
import type { DatiGeneraliData, DettaglioLineaData } from "../types.js";

const datiGenerali: DatiGeneraliData = {
  tipoDocumento: "TD01",
  divisa: "EUR",
  data: "2026-03-02",
  numero: "1",
  causale: "Consulenza informatica",
  importoBollo: 2.0,
};

const linee: DettaglioLineaData[] = [
  {
    numeroLinea: 1,
    descrizione: "Consulenza informatica",
    quantita: 1,
    prezzoUnitario: 1000.0,
    prezzoTotale: 1000.0,
    aliquotaIva: 0,
    natura: "N2.2",
  },
  {
    numeroLinea: 2,
    descrizione: "Sviluppo software",
    quantita: 2,
    prezzoUnitario: 500.0,
    prezzoTotale: 1000.0,
    aliquotaIva: 0,
    natura: "N2.2",
  },
];

describe("buildBody", () => {
  it("should build DatiGeneraliDocumento", () => {
    const body = buildBody(datiGenerali, linee);
    const dg = body.DatiGenerali.DatiGeneraliDocumento;

    expect(dg.TipoDocumento).toBe("TD01");
    expect(dg.Divisa).toBe("EUR");
    expect(dg.Data).toBe("2026-03-02");
    expect(dg.Numero).toBe("1");
    expect(dg.Causale).toBe("Consulenza informatica");
  });

  it("should include DatiBollo when importoBollo is set", () => {
    const body = buildBody(datiGenerali, linee);
    const dg = body.DatiGenerali.DatiGeneraliDocumento;

    expect(dg.DatiBollo.BolloVirtuale).toBe("SI");
    expect(dg.DatiBollo.ImportoBollo).toBe("2.00");
  });

  it("should omit DatiBollo when importoBollo is not set", () => {
    const noBolloDati = { ...datiGenerali, importoBollo: undefined };
    const body = buildBody(noBolloDati, linee);
    const dg = body.DatiGenerali.DatiGeneraliDocumento;

    expect(dg.DatiBollo).toBeUndefined();
  });

  it("should build DettaglioLinee array", () => {
    const body = buildBody(datiGenerali, linee);
    const dl = body.DatiBeniServizi.DettaglioLinee;

    expect(dl).toHaveLength(2);
    expect(dl[0].NumeroLinea).toBe(1);
    expect(dl[0].Descrizione).toBe("Consulenza informatica");
    expect(dl[0].Quantita).toBe("1.00");
    expect(dl[0].PrezzoUnitario).toBe("1000.00");
    expect(dl[0].PrezzoTotale).toBe("1000.00");
    expect(dl[0].AliquotaIVA).toBe("0.00");
    expect(dl[0].Natura).toBe("N2.2");
  });

  it("should build DatiRiepilogo for forfettario (0% IVA, N2.2)", () => {
    const body = buildBody(datiGenerali, linee);
    const dr = body.DatiBeniServizi.DatiRiepilogo;

    expect(dr).toHaveLength(1);
    expect(dr[0].AliquotaIVA).toBe("0.00");
    expect(dr[0].ImponibileImporto).toBe("2000.00");
    expect(dr[0].Imposta).toBe("0.00");
    expect(dr[0].Natura).toBe("N2.2");
    expect(dr[0].RiferimentoNormativo).toContain("art.1");
  });

  it("should build DatiPagamento with total", () => {
    const body = buildBody(datiGenerali, linee);
    const dp = body.DatiPagamento;

    expect(dp.CondizioniPagamento).toBe("TP02");
    expect(dp.DettaglioPagamento.ModalitaPagamento).toBe("MP05");
    // Total = imponibile (2000) + bollo (2) = 2002
    expect(dp.DettaglioPagamento.ImportoPagamento).toBe("2002.00");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: FAIL — cannot find module `../sections/body.js`

**Step 3: Implement buildBody**

```ts
// packages/fattura-xml/src/sections/body.ts
import { DISCLAIMER_FORFETTARIO } from "@fatturino/shared";
import type { DatiGeneraliData, DettaglioLineaData } from "../types.js";

export function buildBody(datiGenerali: DatiGeneraliData, linee: DettaglioLineaData[]) {
  const imponibile = linee.reduce((sum, l) => sum + l.prezzoTotale, 0);
  const bolloAmount = datiGenerali.importoBollo ?? 0;
  const totalePagamento = imponibile + bolloAmount;

  return {
    DatiGenerali: {
      DatiGeneraliDocumento: buildDatiGeneraliDocumento(datiGenerali),
    },
    DatiBeniServizi: {
      DettaglioLinee: linee.map(buildDettaglioLinea),
      DatiRiepilogo: buildDatiRiepilogo(linee),
    },
    DatiPagamento: {
      CondizioniPagamento: "TP02", // pagamento completo
      DettaglioPagamento: {
        ModalitaPagamento: "MP05", // bonifico
        ImportoPagamento: totalePagamento.toFixed(2),
      },
    },
  };
}

function buildDatiGeneraliDocumento(dati: DatiGeneraliData) {
  const doc: Record<string, unknown> = {
    TipoDocumento: dati.tipoDocumento,
    Divisa: dati.divisa,
    Data: dati.data,
    Numero: dati.numero,
  };

  if (dati.importoBollo) {
    doc.DatiBollo = {
      BolloVirtuale: "SI",
      ImportoBollo: dati.importoBollo.toFixed(2),
    };
  }

  if (dati.causale) {
    doc.Causale = dati.causale;
  }

  return doc;
}

function buildDettaglioLinea(linea: DettaglioLineaData) {
  return {
    NumeroLinea: linea.numeroLinea,
    Descrizione: linea.descrizione,
    Quantita: linea.quantita.toFixed(2),
    PrezzoUnitario: linea.prezzoUnitario.toFixed(2),
    PrezzoTotale: linea.prezzoTotale.toFixed(2),
    AliquotaIVA: linea.aliquotaIva.toFixed(2),
    Natura: linea.natura,
  };
}

function buildDatiRiepilogo(linee: DettaglioLineaData[]) {
  // Group by AliquotaIVA + Natura
  const groups = new Map<string, { aliquota: number; natura?: string; imponibile: number }>();

  for (const linea of linee) {
    const key = `${linea.aliquotaIva}-${linea.natura ?? ""}`;
    const existing = groups.get(key);
    if (existing) {
      existing.imponibile += linea.prezzoTotale;
    } else {
      groups.set(key, {
        aliquota: linea.aliquotaIva,
        natura: linea.natura,
        imponibile: linea.prezzoTotale,
      });
    }
  }

  return Array.from(groups.values()).map((g) => {
    const riepilogo: Record<string, string> = {
      AliquotaIVA: g.aliquota.toFixed(2),
      ImponibileImporto: g.imponibile.toFixed(2),
      Imposta: (g.imponibile * g.aliquota / 100).toFixed(2),
    };

    if (g.natura) {
      riepilogo.Natura = g.natura;
      riepilogo.RiferimentoNormativo = DISCLAIMER_FORFETTARIO;
    }

    return riepilogo;
  });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: PASS (all body tests)

**Step 5: Commit**

```bash
git add packages/fattura-xml/src/sections/body.ts packages/fattura-xml/src/__tests__/body.test.ts
git commit -m "feat(fattura-xml): build FatturaPA body section"
```

---

### Task 5: Main FatturaBuilder — Assembles Complete XML

**Files:**
- Create: `packages/fattura-xml/src/builder.ts`
- Create: `packages/fattura-xml/src/__tests__/builder.test.ts`

**Step 1: Write the failing test**

```ts
// packages/fattura-xml/src/__tests__/builder.test.ts
import { describe, it, expect } from "vitest";
import { buildFatturaXml } from "../builder.js";
import type { FatturaInput } from "../types.js";

const validInput: FatturaInput = {
  cedente: {
    partitaIva: "01234567890",
    codiceFiscale: "RSSMRA85M01H501Z",
    ragioneSociale: "Mario Rossi",
    regimeFiscale: "RF19",
    indirizzo: "Via Roma 1",
    cap: "00100",
    citta: "Roma",
    provincia: "RM",
    nazione: "IT",
  },
  cessionario: {
    tipo: "persona_giuridica",
    partitaIva: "09876543210",
    codiceFiscale: "09876543210",
    ragioneSociale: "Acme S.r.l.",
    indirizzo: "Via Milano 10",
    cap: "20100",
    citta: "Milano",
    provincia: "MI",
    nazione: "IT",
    codiceSdi: "ABCDEFG",
  },
  datiGenerali: {
    tipoDocumento: "TD01",
    divisa: "EUR",
    data: "2026-03-02",
    numero: "1",
    causale: "Consulenza informatica marzo 2026",
    importoBollo: 2.0,
  },
  linee: [
    {
      numeroLinea: 1,
      descrizione: "Consulenza informatica",
      quantita: 1,
      prezzoUnitario: 1000.0,
      prezzoTotale: 1000.0,
      aliquotaIva: 0,
      natura: "N2.2",
    },
  ],
};

describe("buildFatturaXml", () => {
  it("should produce valid XML string", () => {
    const xml = buildFatturaXml(validInput);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<p:FatturaElettronica");
    expect(xml).toContain("versione=\"FPR12\"");
    expect(xml).toContain("</p:FatturaElettronica>");
  });

  it("should contain FatturaElettronicaHeader", () => {
    const xml = buildFatturaXml(validInput);

    expect(xml).toContain("<FatturaElettronicaHeader>");
    expect(xml).toContain("<DatiTrasmissione>");
    expect(xml).toContain("<CedentePrestatore>");
    expect(xml).toContain("<CessionarioCommittente>");
  });

  it("should contain FatturaElettronicaBody", () => {
    const xml = buildFatturaXml(validInput);

    expect(xml).toContain("<FatturaElettronicaBody>");
    expect(xml).toContain("<DatiGenerali>");
    expect(xml).toContain("<DatiBeniServizi>");
    expect(xml).toContain("<DatiPagamento>");
  });

  it("should contain cedente P.IVA", () => {
    const xml = buildFatturaXml(validInput);
    expect(xml).toContain("<IdCodice>01234567890</IdCodice>");
  });

  it("should produce well-formed XML for TD04 (nota di credito)", () => {
    const td04Input = {
      ...validInput,
      datiGenerali: { ...validInput.datiGenerali, tipoDocumento: "TD04" },
    };
    const xml = buildFatturaXml(td04Input);

    expect(xml).toContain("<TipoDocumento>TD04</TipoDocumento>");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: FAIL — cannot find module `../builder.js`

**Step 3: Implement buildFatturaXml**

```ts
// packages/fattura-xml/src/builder.ts
import { XMLBuilder } from "fast-xml-parser";
import { buildHeader } from "./sections/header.js";
import { buildBody } from "./sections/body.js";
import type { FatturaInput } from "./types.js";

const FATTURAPA_NAMESPACE = "http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2";

export function buildFatturaXml(input: FatturaInput): string {
  const header = buildHeader(input.cedente, input.cessionario);
  const body = buildBody(input.datiGenerali, input.linee);

  const doc = {
    "p:FatturaElettronica": {
      "@_xmlns:p": FATTURAPA_NAMESPACE,
      "@_versione": "FPR12",
      FatturaElettronicaHeader: header,
      FatturaElettronicaBody: body,
    },
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    suppressEmptyNode: true,
  });

  const xmlBody = builder.build(doc);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: PASS (all builder tests)

**Step 5: Export from index.ts**

Update `packages/fattura-xml/src/index.ts`:
```ts
export { buildFatturaXml } from "./builder.js";
export { validateBusinessRules } from "./validation/business-rules.js";
export type {
  FatturaInput,
  CedenteData,
  CessionarioData,
  DatiGeneraliData,
  DettaglioLineaData,
} from "./types.js";
```

Note: `validateBusinessRules` will be created in Task 6. For now this export will cause a type error — that's fine, it will be resolved in the next task.

**Step 6: Commit**

```bash
git add packages/fattura-xml/src/builder.ts packages/fattura-xml/src/__tests__/builder.test.ts packages/fattura-xml/src/index.ts
git commit -m "feat(fattura-xml): main XML builder assembles complete FatturaPA document"
```

---

### Task 6: Business Rules Validator

**Files:**
- Create: `packages/fattura-xml/src/validation/business-rules.ts`
- Create: `packages/fattura-xml/src/__tests__/business-rules.test.ts`

**Step 1: Write the failing test**

```ts
// packages/fattura-xml/src/__tests__/business-rules.test.ts
import { describe, it, expect } from "vitest";
import { validateBusinessRules } from "../validation/business-rules.js";
import type { FatturaInput } from "../types.js";

function makeValidInput(): FatturaInput {
  return {
    cedente: {
      partitaIva: "01234567890",
      codiceFiscale: "RSSMRA85M01H501Z",
      ragioneSociale: "Mario Rossi",
      regimeFiscale: "RF19",
      indirizzo: "Via Roma 1",
      cap: "00100",
      citta: "Roma",
      provincia: "RM",
      nazione: "IT",
    },
    cessionario: {
      tipo: "persona_giuridica",
      partitaIva: "09876543210",
      codiceFiscale: "09876543210",
      ragioneSociale: "Acme S.r.l.",
      indirizzo: "Via Milano 10",
      cap: "20100",
      citta: "Milano",
      provincia: "MI",
      nazione: "IT",
      codiceSdi: "ABCDEFG",
    },
    datiGenerali: {
      tipoDocumento: "TD01",
      divisa: "EUR",
      data: "2026-03-02",
      numero: "1",
      causale: "Operazione effettuata ai sensi dell'art.1, commi da 54 a 89, della Legge n. 190/2014 e successive modificazioni. Si richiede la non applicazione della ritenuta alla fonte a titolo d'acconto ai sensi dell'art. 1 comma 67 della Legge numero 190/2014.",
      importoBollo: 2.0,
    },
    linee: [
      {
        numeroLinea: 1,
        descrizione: "Consulenza",
        quantita: 1,
        prezzoUnitario: 100.0,
        prezzoTotale: 100.0,
        aliquotaIva: 0,
        natura: "N2.2",
      },
    ],
  };
}

describe("validateBusinessRules", () => {
  it("should return empty array for valid forfettario input", () => {
    const errors = validateBusinessRules(makeValidInput());
    expect(errors).toEqual([]);
  });

  it("should error if regimeFiscale is not RF19", () => {
    const input = makeValidInput();
    input.cedente.regimeFiscale = "RF01";
    const errors = validateBusinessRules(input);

    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_REGIME_FISCALE" })
    );
  });

  it("should error if line has non-zero aliquotaIva for forfettario", () => {
    const input = makeValidInput();
    input.linee[0].aliquotaIva = 22;
    const errors = validateBusinessRules(input);

    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_ALIQUOTA_IVA" })
    );
  });

  it("should error if line natura is not N2.2 for forfettario", () => {
    const input = makeValidInput();
    input.linee[0].natura = "N1";
    const errors = validateBusinessRules(input);

    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_NATURA_IVA" })
    );
  });

  it("should error if bollo missing when imponibile > 77.47", () => {
    const input = makeValidInput();
    input.datiGenerali.importoBollo = undefined;
    const errors = validateBusinessRules(input);

    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_BOLLO" })
    );
  });

  it("should not error about bollo when imponibile <= 77.47", () => {
    const input = makeValidInput();
    input.linee[0].prezzoUnitario = 50;
    input.linee[0].prezzoTotale = 50;
    input.datiGenerali.importoBollo = undefined;
    const errors = validateBusinessRules(input);

    expect(errors.find((e) => e.code === "MISSING_BOLLO")).toBeUndefined();
  });

  it("should error if tipoDocumento is not TD01 or TD04", () => {
    const input = makeValidInput();
    input.datiGenerali.tipoDocumento = "TD06";
    const errors = validateBusinessRules(input);

    expect(errors).toContainEqual(
      expect.objectContaining({ code: "UNSUPPORTED_TIPO_DOCUMENTO" })
    );
  });

  it("should error if partitaIva format is invalid", () => {
    const input = makeValidInput();
    input.cedente.partitaIva = "123"; // not 11 digits
    const errors = validateBusinessRules(input);

    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_PARTITA_IVA_CEDENTE" })
    );
  });

  it("should error if codiceSdi is not 7 characters", () => {
    const input = makeValidInput();
    input.cessionario.codiceSdi = "ABC";
    const errors = validateBusinessRules(input);

    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_CODICE_SDI" })
    );
  });

  it("should error if no codiceSdi and no PEC", () => {
    const input = makeValidInput();
    input.cessionario.codiceSdi = undefined;
    input.cessionario.pec = undefined;
    const errors = validateBusinessRules(input);

    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_DESTINATARIO" })
    );
  });

  it("should accept codiceSdi 0000000 with PEC", () => {
    const input = makeValidInput();
    input.cessionario.codiceSdi = "0000000";
    input.cessionario.pec = "test@pec.it";
    const errors = validateBusinessRules(input);

    expect(errors.find((e) => e.code === "MISSING_DESTINATARIO")).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: FAIL — cannot find module `../validation/business-rules.js`

**Step 3: Implement business rules validator**

```ts
// packages/fattura-xml/src/validation/business-rules.ts
import { SOGLIA_BOLLO, IMPORTO_BOLLO } from "@fatturino/shared";
import type { FatturaInput } from "../types.js";

export interface ValidationError {
  code: string;
  field: string;
  message: string;
}

const SUPPORTED_TIPI_DOCUMENTO = ["TD01", "TD04"];
const PARTITA_IVA_REGEX = /^\d{11}$/;

export function validateBusinessRules(input: FatturaInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Regime fiscale
  if (input.cedente.regimeFiscale !== "RF19") {
    errors.push({
      code: "INVALID_REGIME_FISCALE",
      field: "cedente.regimeFiscale",
      message: "Il regime fiscale deve essere RF19 (Regime Forfettario)",
    });
  }

  // Tipo documento
  if (!SUPPORTED_TIPI_DOCUMENTO.includes(input.datiGenerali.tipoDocumento)) {
    errors.push({
      code: "UNSUPPORTED_TIPO_DOCUMENTO",
      field: "datiGenerali.tipoDocumento",
      message: `Tipo documento non supportato: ${input.datiGenerali.tipoDocumento}. Supportati: ${SUPPORTED_TIPI_DOCUMENTO.join(", ")}`,
    });
  }

  // Cedente P.IVA format
  if (!PARTITA_IVA_REGEX.test(input.cedente.partitaIva)) {
    errors.push({
      code: "INVALID_PARTITA_IVA_CEDENTE",
      field: "cedente.partitaIva",
      message: "La Partita IVA del cedente deve essere di 11 cifre",
    });
  }

  // Line items — forfettario rules
  for (let i = 0; i < input.linee.length; i++) {
    const linea = input.linee[i];

    if (linea.aliquotaIva !== 0) {
      errors.push({
        code: "INVALID_ALIQUOTA_IVA",
        field: `linee[${i}].aliquotaIva`,
        message: `Aliquota IVA deve essere 0% per Regime Forfettario (linea ${linea.numeroLinea})`,
      });
    }

    if (linea.natura !== "N2.2") {
      errors.push({
        code: "INVALID_NATURA_IVA",
        field: `linee[${i}].natura`,
        message: `Natura IVA deve essere N2.2 per Regime Forfettario (linea ${linea.numeroLinea})`,
      });
    }
  }

  // Bollo
  const imponibile = input.linee.reduce((sum, l) => sum + l.prezzoTotale, 0);
  if (imponibile > SOGLIA_BOLLO && !input.datiGenerali.importoBollo) {
    errors.push({
      code: "MISSING_BOLLO",
      field: "datiGenerali.importoBollo",
      message: `Imposta di bollo obbligatoria per importi superiori a €${SOGLIA_BOLLO}`,
    });
  }

  // Codice destinatario / PEC
  const sdi = input.cessionario.codiceSdi;
  const pec = input.cessionario.pec;

  if (sdi && sdi !== "0000000" && sdi.length !== 7) {
    errors.push({
      code: "INVALID_CODICE_SDI",
      field: "cessionario.codiceSdi",
      message: "Il Codice SDI deve essere di 7 caratteri",
    });
  }

  if ((!sdi || sdi === "0000000") && !pec) {
    errors.push({
      code: "MISSING_DESTINATARIO",
      field: "cessionario.codiceSdi",
      message: "È necessario un Codice SDI o un indirizzo PEC per il destinatario",
    });
  }

  return errors;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: PASS (all business rules tests)

**Step 5: Commit**

```bash
git add packages/fattura-xml/src/validation/business-rules.ts packages/fattura-xml/src/__tests__/business-rules.test.ts
git commit -m "feat(fattura-xml): business rules validator for forfettario invoices"
```

---

### Task 7: XSD Schema Validator

**Files:**
- Create: `packages/fattura-xml/src/validation/xsd-validator.ts`
- Create: `packages/fattura-xml/src/__tests__/xsd-validator.test.ts`
- Download: `packages/fattura-xml/src/xsd/Schema_del_file_xml_FatturaPA_v1.2.2.xsd`

**Step 1: Download the official XSD**

The official FatturaPA XSD is available from the Agenzia delle Entrate. Download it and place it in the xsd directory.

Run: `mkdir -p /Users/iba/Freelance/fatturino/packages/fattura-xml/src/xsd`

The XSD file needs to be obtained from https://www.fatturapa.gov.it/it/norme-e-regole/documentazione-fattura-elettronica/formato-fatturapa/ — download the v1.2.2 schema. If the download fails, create a minimal XSD for initial development and replace it with the official one before shipping.

**Step 2: Write the failing test**

```ts
// packages/fattura-xml/src/__tests__/xsd-validator.test.ts
import { describe, it, expect } from "vitest";
import { validateXsd } from "../validation/xsd-validator.js";
import { buildFatturaXml } from "../builder.js";
import type { FatturaInput } from "../types.js";

const validInput: FatturaInput = {
  cedente: {
    partitaIva: "01234567890",
    codiceFiscale: "RSSMRA85M01H501Z",
    ragioneSociale: "Mario Rossi",
    regimeFiscale: "RF19",
    indirizzo: "Via Roma 1",
    cap: "00100",
    citta: "Roma",
    provincia: "RM",
    nazione: "IT",
  },
  cessionario: {
    tipo: "persona_giuridica",
    partitaIva: "09876543210",
    codiceFiscale: "09876543210",
    ragioneSociale: "Acme S.r.l.",
    indirizzo: "Via Milano 10",
    cap: "20100",
    citta: "Milano",
    provincia: "MI",
    nazione: "IT",
    codiceSdi: "ABCDEFG",
  },
  datiGenerali: {
    tipoDocumento: "TD01",
    divisa: "EUR",
    data: "2026-03-02",
    numero: "1",
    causale: "Consulenza",
    importoBollo: 2.0,
  },
  linee: [
    {
      numeroLinea: 1,
      descrizione: "Consulenza informatica",
      quantita: 1,
      prezzoUnitario: 1000.0,
      prezzoTotale: 1000.0,
      aliquotaIva: 0,
      natura: "N2.2",
    },
  ],
};

describe("validateXsd", () => {
  it("should return empty errors for valid XML", () => {
    const xml = buildFatturaXml(validInput);
    const errors = validateXsd(xml);
    expect(errors).toEqual([]);
  });

  it("should return errors for malformed XML", () => {
    const errors = validateXsd("<not-valid-xml>");
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

**Step 3: Implement XSD validator**

```ts
// packages/fattura-xml/src/validation/xsd-validator.ts
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ValidationError } from "./business-rules.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let xsdContent: string | null = null;

function getXsdContent(): string {
  if (!xsdContent) {
    const xsdPath = join(__dirname, "..", "xsd", "Schema_del_file_xml_FatturaPA_v1.2.2.xsd");
    xsdContent = readFileSync(xsdPath, "utf-8");
  }
  return xsdContent;
}

export function validateXsd(xml: string): ValidationError[] {
  try {
    // Dynamic import to handle native dependency
    // libxmljs2 validates XML against XSD schema
    const libxmljs = require("libxmljs2");
    const xmlDoc = libxmljs.parseXml(xml);
    const xsdDoc = libxmljs.parseXml(getXsdContent());

    const isValid = xmlDoc.validate(xsdDoc);

    if (isValid) {
      return [];
    }

    return xmlDoc.validationErrors.map((err: { message: string; line: number }) => ({
      code: "XSD_VALIDATION_ERROR",
      field: `line:${err.line}`,
      message: err.message.trim(),
    }));
  } catch (error) {
    return [
      {
        code: "XSD_PARSE_ERROR",
        field: "xml",
        message: error instanceof Error ? error.message : "Failed to parse XML",
      },
    ];
  }
}
```

Note: `libxmljs2` is a native C++ addon. If it proves problematic in CI, fall back to a pure-JS approach using `fast-xml-parser` to validate structure. The XSD validator is a safety net — business rules catch most issues first.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @fatturino/fattura-xml test`
Expected: PASS (XSD tests — may need adjustment based on actual XSD file)

**Step 5: Update index.ts exports**

```ts
// packages/fattura-xml/src/index.ts
export { buildFatturaXml } from "./builder.js";
export { validateBusinessRules } from "./validation/business-rules.js";
export { validateXsd } from "./validation/xsd-validator.js";
export type { ValidationError } from "./validation/business-rules.js";
export type {
  FatturaInput,
  CedenteData,
  CessionarioData,
  DatiGeneraliData,
  DettaglioLineaData,
} from "./types.js";
```

**Step 6: Commit**

```bash
git add packages/fattura-xml/src/validation/xsd-validator.ts packages/fattura-xml/src/__tests__/xsd-validator.test.ts packages/fattura-xml/src/xsd/ packages/fattura-xml/src/index.ts
git commit -m "feat(fattura-xml): XSD schema validator with official FatturaPA v1.2.2 schema"
```

---

### Task 8: API Routes for XML Generation and Validation

**Files:**
- Modify: `apps/api/package.json` (add `@fatturino/fattura-xml` dependency)
- Modify: `apps/api/src/routes/invoices.ts` (add XML endpoints)
- Create: `apps/api/src/__tests__/invoice-xml.test.ts`

**Step 1: Add fattura-xml dependency to API**

In `apps/api/package.json`, add to `dependencies`:
```json
"@fatturino/fattura-xml": "workspace:*"
```

Run: `cd /Users/iba/Freelance/fatturino && pnpm install`

**Step 2: Write the failing test**

```ts
// apps/api/src/__tests__/invoice-xml.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FatturaInput } from "@fatturino/fattura-xml";

// Test the data mapping from DB models to FatturaInput
// (the actual XML building is tested in the fattura-xml package)

describe("mapToFatturaInput", () => {
  it("should map user profile to CedenteData", async () => {
    // This will test the mapping function we create
    const { mapToFatturaInput } = await import("../services/fattura-mapper.js");

    const userProfile = {
      partitaIva: "01234567890",
      codiceFiscale: "RSSMRA85M01H501Z",
      ragioneSociale: "Mario Rossi",
      regimeFiscale: "RF19",
      indirizzo: "Via Roma 1",
      cap: "00100",
      citta: "Roma",
      provincia: "RM",
    };

    const client = {
      tipo: "persona_giuridica" as const,
      partitaIva: "09876543210",
      codiceFiscale: "09876543210",
      ragioneSociale: "Acme S.r.l.",
      indirizzo: "Via Milano 10",
      cap: "20100",
      citta: "Milano",
      provincia: "MI",
      nazione: "IT",
      codiceSdi: "ABCDEFG",
      pec: null,
      nome: null,
      cognome: null,
    };

    const invoice = {
      tipoDocumento: "TD01",
      dataEmissione: new Date("2026-03-02"),
      numeroFattura: 1,
      causale: "Consulenza",
      imponibile: "1000.00",
      impostaBollo: "2.00",
    };

    const lines = [
      {
        descrizione: "Consulenza informatica",
        quantita: "1.0000",
        prezzoUnitario: "1000.00",
        prezzoTotale: "1000.00",
        aliquotaIva: "0.00",
        naturaIva: "N2.2",
      },
    ];

    const result = mapToFatturaInput(userProfile, client, invoice, lines);

    expect(result.cedente.partitaIva).toBe("01234567890");
    expect(result.cedente.regimeFiscale).toBe("RF19");
    expect(result.cessionario.tipo).toBe("persona_giuridica");
    expect(result.cessionario.ragioneSociale).toBe("Acme S.r.l.");
    expect(result.datiGenerali.tipoDocumento).toBe("TD01");
    expect(result.datiGenerali.data).toBe("2026-03-02");
    expect(result.datiGenerali.importoBollo).toBe(2.0);
    expect(result.linee[0].prezzoTotale).toBe(1000.0);
    expect(result.linee[0].natura).toBe("N2.2");
  });
});
```

**Step 3: Implement the mapper service**

```ts
// apps/api/src/services/fattura-mapper.ts
import type { FatturaInput } from "@fatturino/fattura-xml";

export function mapToFatturaInput(
  userProfile: {
    partitaIva: string;
    codiceFiscale: string;
    ragioneSociale: string;
    regimeFiscale: string;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
  },
  client: {
    tipo: "persona_fisica" | "persona_giuridica";
    partitaIva: string | null;
    codiceFiscale: string;
    ragioneSociale: string | null;
    nome: string | null;
    cognome: string | null;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
    nazione: string;
    codiceSdi: string | null;
    pec: string | null;
  },
  invoice: {
    tipoDocumento: string;
    dataEmissione: Date;
    numeroFattura: number;
    causale: string | null;
    imponibile: string;
    impostaBollo: string;
  },
  lines: Array<{
    descrizione: string;
    quantita: string;
    prezzoUnitario: string;
    prezzoTotale: string;
    aliquotaIva: string;
    naturaIva: string | null;
  }>
): FatturaInput {
  const bollo = parseFloat(invoice.impostaBollo);

  return {
    cedente: {
      partitaIva: userProfile.partitaIva,
      codiceFiscale: userProfile.codiceFiscale,
      ragioneSociale: userProfile.ragioneSociale,
      regimeFiscale: userProfile.regimeFiscale,
      indirizzo: userProfile.indirizzo,
      cap: userProfile.cap,
      citta: userProfile.citta,
      provincia: userProfile.provincia,
      nazione: "IT",
    },
    cessionario: {
      tipo: client.tipo,
      partitaIva: client.partitaIva ?? undefined,
      codiceFiscale: client.codiceFiscale,
      ragioneSociale: client.ragioneSociale ?? undefined,
      nome: client.nome ?? undefined,
      cognome: client.cognome ?? undefined,
      indirizzo: client.indirizzo,
      cap: client.cap,
      citta: client.citta,
      provincia: client.provincia,
      nazione: client.nazione,
      codiceSdi: client.codiceSdi ?? undefined,
      pec: client.pec ?? undefined,
    },
    datiGenerali: {
      tipoDocumento: invoice.tipoDocumento,
      divisa: "EUR",
      data: invoice.dataEmissione.toISOString().split("T")[0],
      numero: invoice.numeroFattura.toString(),
      causale: invoice.causale ?? undefined,
      importoBollo: bollo > 0 ? bollo : undefined,
    },
    linee: lines.map((line, i) => ({
      numeroLinea: i + 1,
      descrizione: line.descrizione,
      quantita: parseFloat(line.quantita),
      prezzoUnitario: parseFloat(line.prezzoUnitario),
      prezzoTotale: parseFloat(line.prezzoTotale),
      aliquotaIva: parseFloat(line.aliquotaIva),
      natura: line.naturaIva ?? "N2.2",
    })),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @fatturino/api test`
Expected: PASS

**Step 5: Add XML routes to invoices.ts**

Add these routes at the end of `invoiceRoutes` in `apps/api/src/routes/invoices.ts`:

```ts
// --- Add these imports at top of file ---
import { eq, and } from "drizzle-orm";
import { userProfiles } from "../db/schema.js";
import { buildFatturaXml, validateBusinessRules } from "@fatturino/fattura-xml";
import { mapToFatturaInput } from "../services/fattura-mapper.js";

// --- Add these routes inside invoiceRoutes function ---

// Validate invoice for XML generation
app.get<{ Params: { id: string } }>("/api/invoices/:id/xml/validate", async (request, reply) => {
  const userId = getUserId(request);

  // Fetch user profile
  const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  if (profiles.length === 0) {
    return reply.status(400).send({ error: "Profilo utente non completato", code: "MISSING_PROFILE" });
  }

  // Fetch invoice + lines
  const invoice = await db.select().from(invoices)
    .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));
  if (invoice.length === 0) {
    return reply.status(404).send({ error: "Invoice not found" });
  }

  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, request.params.id));

  // Fetch client
  const clientRows = await db.select().from(clients).where(eq(clients.id, invoice[0].clientId));

  const input = mapToFatturaInput(profiles[0], clientRows[0], invoice[0], lines);
  const errors = validateBusinessRules(input);

  return { valid: errors.length === 0, errors };
});

// Generate and download XML
app.get<{ Params: { id: string } }>("/api/invoices/:id/xml", async (request, reply) => {
  const userId = getUserId(request);

  const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  if (profiles.length === 0) {
    return reply.status(400).send({ error: "Profilo utente non completato", code: "MISSING_PROFILE" });
  }

  const invoice = await db.select().from(invoices)
    .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));
  if (invoice.length === 0) {
    return reply.status(404).send({ error: "Invoice not found" });
  }

  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, request.params.id));
  const clientRows = await db.select().from(clients).where(eq(clients.id, invoice[0].clientId));

  const input = mapToFatturaInput(profiles[0], clientRows[0], invoice[0], lines);

  // Business rule validation
  const errors = validateBusinessRules(input);
  if (errors.length > 0) {
    return reply.status(422).send({ error: "Validation failed", errors });
  }

  const xml = buildFatturaXml(input);

  // Store XML in DB
  await db.update(invoices).set({ xmlContent: xml }).where(eq(invoices.id, request.params.id));

  const filename = `IT${profiles[0].partitaIva}_${invoice[0].numeroFattura.toString().padStart(5, "0")}.xml`;

  return reply
    .header("Content-Type", "application/xml")
    .header("Content-Disposition", `attachment; filename="${filename}"`)
    .send(xml);
});
```

Note: You'll need to add `import { clients, userProfiles } from "../db/schema.js"` to the imports at the top of the file.

**Step 6: Run tests**

Run: `pnpm --filter @fatturino/api test`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/src/services/fattura-mapper.ts apps/api/src/__tests__/invoice-xml.test.ts apps/api/src/routes/invoices.ts apps/api/package.json
git commit -m "feat(api): XML generation and validation endpoints for invoices"
```

---

### Task 9: PDF Generation Service

**Files:**
- Create: `apps/api/src/services/pdf/invoice-template.ts`
- Create: `apps/api/src/services/pdf/pdf-generator.ts`
- Create: `apps/api/src/__tests__/invoice-template.test.ts`
- Modify: `apps/api/src/routes/invoices.ts` (add PDF endpoint)
- Modify: `apps/api/package.json` (add `playwright` dependency)

**Step 1: Add playwright dependency to API**

In `apps/api/package.json`, add to `dependencies`:
```json
"playwright": "^1.58.0"
```

Run: `cd /Users/iba/Freelance/fatturino && pnpm install`
Run: `pnpm --filter @fatturino/api exec playwright install chromium`

**Step 2: Write the failing test for the HTML template**

```ts
// apps/api/src/__tests__/invoice-template.test.ts
import { describe, it, expect } from "vitest";
import { renderInvoiceHtml } from "../services/pdf/invoice-template.js";

const templateData = {
  cedente: {
    ragioneSociale: "Mario Rossi",
    partitaIva: "01234567890",
    codiceFiscale: "RSSMRA85M01H501Z",
    indirizzo: "Via Roma 1",
    cap: "00100",
    citta: "Roma",
    provincia: "RM",
  },
  cliente: {
    denominazione: "Acme S.r.l.",
    partitaIva: "09876543210",
    codiceFiscale: "09876543210",
    indirizzo: "Via Milano 10",
    cap: "20100",
    citta: "Milano",
    provincia: "MI",
  },
  fattura: {
    numero: "1/2026",
    data: "02/03/2026",
    causale: "Consulenza informatica",
  },
  linee: [
    {
      descrizione: "Consulenza informatica",
      quantita: "1,00",
      prezzoUnitario: "1.000,00",
      prezzoTotale: "1.000,00",
    },
  ],
  imponibile: "1.000,00",
  bollo: "2,00",
  totale: "1.002,00",
  disclaimer: "Operazione effettuata ai sensi...",
};

describe("renderInvoiceHtml", () => {
  it("should produce valid HTML", () => {
    const html = renderInvoiceHtml(templateData);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Mario Rossi");
    expect(html).toContain("01234567890");
    expect(html).toContain("Acme S.r.l.");
    expect(html).toContain("1/2026");
    expect(html).toContain("Consulenza informatica");
    expect(html).toContain("1.000,00");
    expect(html).toContain("2,00"); // bollo
    expect(html).toContain("1.002,00"); // totale
  });

  it("should omit bollo row when bollo is not present", () => {
    const noBolloData = { ...templateData, bollo: undefined };
    const html = renderInvoiceHtml(noBolloData);

    expect(html).not.toContain("Imposta di bollo");
  });
});
```

**Step 3: Implement the HTML template**

```ts
// apps/api/src/services/pdf/invoice-template.ts

export interface InvoiceTemplateData {
  cedente: {
    ragioneSociale: string;
    partitaIva: string;
    codiceFiscale: string;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
  };
  cliente: {
    denominazione: string;
    partitaIva?: string;
    codiceFiscale: string;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
  };
  fattura: {
    numero: string;
    data: string;
    causale?: string;
  };
  linee: Array<{
    descrizione: string;
    quantita: string;
    prezzoUnitario: string;
    prezzoTotale: string;
  }>;
  imponibile: string;
  bollo?: string;
  totale: string;
  disclaimer: string;
}

export function renderInvoiceHtml(data: InvoiceTemplateData): string {
  const bolloRow = data.bollo
    ? `<tr><td colspan="3" class="text-right">Imposta di bollo</td><td class="text-right">${data.bollo}</td></tr>`
    : "";

  const lineRows = data.linee
    .map(
      (l) => `
      <tr>
        <td>${l.descrizione}</td>
        <td class="text-right">${l.quantita}</td>
        <td class="text-right">${l.prezzoUnitario}</td>
        <td class="text-right">${l.prezzoTotale}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; color: #1a1a1a; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .cedente, .cliente { width: 45%; }
    .label { font-size: 9pt; color: #666; text-transform: uppercase; margin-bottom: 4px; }
    .name { font-size: 14pt; font-weight: bold; margin-bottom: 4px; }
    .detail { font-size: 10pt; color: #333; line-height: 1.4; }
    .invoice-meta { margin-bottom: 30px; padding: 12px 16px; background: #f5f5f5; border-radius: 4px; }
    .invoice-meta h2 { font-size: 16pt; margin-bottom: 4px; }
    .invoice-meta .date { font-size: 10pt; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #333; font-size: 9pt; text-transform: uppercase; color: #666; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .totals td { border-bottom: none; font-size: 10pt; }
    .totals .total-row td { font-weight: bold; font-size: 12pt; border-top: 2px solid #333; }
    .disclaimer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 8pt; color: #666; font-style: italic; line-height: 1.4; }
    .causale { margin-bottom: 20px; font-size: 10pt; color: #333; }
  </style>
</head>
<body>
  <div class="header">
    <div class="cedente">
      <div class="label">Cedente / Prestatore</div>
      <div class="name">${data.cedente.ragioneSociale}</div>
      <div class="detail">
        P.IVA: ${data.cedente.partitaIva}<br>
        C.F.: ${data.cedente.codiceFiscale}<br>
        ${data.cedente.indirizzo}<br>
        ${data.cedente.cap} ${data.cedente.citta} (${data.cedente.provincia})
      </div>
    </div>
    <div class="cliente">
      <div class="label">Cessionario / Committente</div>
      <div class="name">${data.cliente.denominazione}</div>
      <div class="detail">
        ${data.cliente.partitaIva ? `P.IVA: ${data.cliente.partitaIva}<br>` : ""}
        C.F.: ${data.cliente.codiceFiscale}<br>
        ${data.cliente.indirizzo}<br>
        ${data.cliente.cap} ${data.cliente.citta} (${data.cliente.provincia})
      </div>
    </div>
  </div>

  <div class="invoice-meta">
    <h2>Fattura ${data.fattura.numero}</h2>
    <div class="date">Data: ${data.fattura.data}</div>
  </div>

  ${data.fattura.causale ? `<div class="causale"><strong>Causale:</strong> ${data.fattura.causale}</div>` : ""}

  <table>
    <thead>
      <tr>
        <th>Descrizione</th>
        <th class="text-right">Quantità</th>
        <th class="text-right">Prezzo unitario</th>
        <th class="text-right">Totale</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
    </tbody>
  </table>

  <table class="totals">
    <tbody>
      <tr><td colspan="3" class="text-right">Imponibile</td><td class="text-right">${data.imponibile}</td></tr>
      ${bolloRow}
      <tr class="total-row"><td colspan="3" class="text-right">Totale documento</td><td class="text-right">${data.totale}</td></tr>
    </tbody>
  </table>

  <div class="disclaimer">${data.disclaimer}</div>
</body>
</html>`;
}
```

**Step 4: Run template test**

Run: `pnpm --filter @fatturino/api test`
Expected: PASS

**Step 5: Implement PDF generator**

```ts
// apps/api/src/services/pdf/pdf-generator.ts
import { chromium, type Browser } from "playwright";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function generatePdf(html: string): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
```

**Step 6: Add PDF route to invoices.ts**

Add at the end of `invoiceRoutes` in `apps/api/src/routes/invoices.ts`:

```ts
// --- Add import at top ---
import { renderInvoiceHtml } from "../services/pdf/invoice-template.js";
import { generatePdf } from "../services/pdf/pdf-generator.js";
import { DISCLAIMER_FORFETTARIO } from "@fatturino/shared";

// --- Add route ---
// Generate and download PDF
app.get<{ Params: { id: string } }>("/api/invoices/:id/pdf", async (request, reply) => {
  const userId = getUserId(request);

  const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  if (profiles.length === 0) {
    return reply.status(400).send({ error: "Profilo utente non completato", code: "MISSING_PROFILE" });
  }

  const invoice = await db.select().from(invoices)
    .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));
  if (invoice.length === 0) {
    return reply.status(404).send({ error: "Invoice not found" });
  }

  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, request.params.id));
  const clientRows = await db.select().from(clients).where(eq(clients.id, invoice[0].clientId));
  const client = clientRows[0];
  const inv = invoice[0];

  const formatNumber = (n: string) =>
    parseFloat(n).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const bollo = parseFloat(inv.impostaBollo);

  const html = renderInvoiceHtml({
    cedente: {
      ragioneSociale: profiles[0].ragioneSociale,
      partitaIva: profiles[0].partitaIva,
      codiceFiscale: profiles[0].codiceFiscale,
      indirizzo: profiles[0].indirizzo,
      cap: profiles[0].cap,
      citta: profiles[0].citta,
      provincia: profiles[0].provincia,
    },
    cliente: {
      denominazione: client.ragioneSociale || [client.nome, client.cognome].filter(Boolean).join(" "),
      partitaIva: client.partitaIva ?? undefined,
      codiceFiscale: client.codiceFiscale,
      indirizzo: client.indirizzo,
      cap: client.cap,
      citta: client.citta,
      provincia: client.provincia,
    },
    fattura: {
      numero: `${inv.numeroFattura}/${inv.anno}`,
      data: new Date(inv.dataEmissione).toLocaleDateString("it-IT"),
      causale: inv.causale ?? undefined,
    },
    linee: lines.map((l) => ({
      descrizione: l.descrizione,
      quantita: formatNumber(l.quantita),
      prezzoUnitario: formatNumber(l.prezzoUnitario),
      prezzoTotale: formatNumber(l.prezzoTotale),
    })),
    imponibile: formatNumber(inv.imponibile),
    bollo: bollo > 0 ? formatNumber(inv.impostaBollo) : undefined,
    totale: formatNumber(inv.totaleDocumento),
    disclaimer: DISCLAIMER_FORFETTARIO,
  });

  const pdf = await generatePdf(html);

  const filename = `Fattura_${inv.numeroFattura}_${inv.anno}.pdf`;

  return reply
    .header("Content-Type", "application/pdf")
    .header("Content-Disposition", `attachment; filename="${filename}"`)
    .send(pdf);
});
```

**Step 7: Run tests**

Run: `pnpm --filter @fatturino/api test`
Expected: PASS

**Step 8: Commit**

```bash
git add apps/api/src/services/pdf/ apps/api/src/__tests__/invoice-template.test.ts apps/api/src/routes/invoices.ts apps/api/package.json
git commit -m "feat(api): PDF generation endpoint using Playwright"
```

---

### Task 10: Settings Page — User Profile Form

**Files:**
- Modify: `apps/web/src/pages/Settings.tsx`
- Create: `apps/web/src/hooks/use-profile.ts`
- Create: `apps/web/src/components/ProfileForm.tsx`
- Modify: `apps/web/src/i18n/locales/it.json` (add settings translations)
- Modify: `apps/web/src/i18n/locales/en.json` (add settings translations)

**Step 1: Create API routes for user profile (backend)**

Add to a new file `apps/api/src/routes/profile.ts`:

```ts
// apps/api/src/routes/profile.ts
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { createUserProfileSchema } from "@fatturino/shared";
import { db } from "../db/index.js";
import { userProfiles } from "../db/schema.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

export async function profileRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  // Get current user's profile
  app.get("/api/profile", async (request, reply) => {
    const userId = getUserId(request);
    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));

    if (profiles.length === 0) {
      return reply.status(404).send({ error: "Profile not found" });
    }

    return profiles[0];
  });

  // Create or update profile
  app.put("/api/profile", async (request, reply) => {
    const userId = getUserId(request);
    const parsed = createUserProfileSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));

    if (existing.length > 0) {
      const [updated] = await db
        .update(userProfiles)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(userProfiles)
      .values({ userId, ...parsed.data })
      .returning();
    return reply.status(201).send(created);
  });
}
```

Register it in `apps/api/src/server.ts`:
```ts
import { profileRoutes } from "./routes/profile.js";
// ... in buildApp():
await app.register(profileRoutes);
```

**Step 2: Create the React Query hook**

```ts
// apps/web/src/hooks/use-profile.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UserProfile {
  id: string;
  userId: string;
  ragioneSociale: string;
  partitaIva: string;
  codiceFiscale: string;
  codiceAteco: string;
  regimeFiscale: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  pec: string | null;
  codiceSdi: string | null;
  iban: string | null;
  annoInizioAttivita: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  ragioneSociale: string;
  partitaIva: string;
  codiceFiscale: string;
  codiceAteco: string;
  regimeFiscale?: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  pec?: string;
  codiceSdi?: string;
  iban?: string;
  annoInizioAttivita: number;
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => api.get<UserProfile>("/profile"),
    retry: false,
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileFormData) => api.put<UserProfile>("/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
```

**Step 3: Create ProfileForm component**

```tsx
// apps/web/src/components/ProfileForm.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile, ProfileFormData } from "@/hooks/use-profile";

interface ProfileFormProps {
  profile?: UserProfile;
  onSubmit: (data: ProfileFormData) => void;
  isLoading: boolean;
}

export function ProfileForm({ profile, onSubmit, isLoading }: ProfileFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ProfileFormData>({
    ragioneSociale: "",
    partitaIva: "",
    codiceFiscale: "",
    codiceAteco: "",
    indirizzo: "",
    cap: "",
    citta: "",
    provincia: "",
    pec: "",
    codiceSdi: "",
    iban: "",
    annoInizioAttivita: new Date().getFullYear(),
  });

  useEffect(() => {
    if (profile) {
      setForm({
        ragioneSociale: profile.ragioneSociale,
        partitaIva: profile.partitaIva,
        codiceFiscale: profile.codiceFiscale,
        codiceAteco: profile.codiceAteco,
        indirizzo: profile.indirizzo,
        cap: profile.cap,
        citta: profile.citta,
        provincia: profile.provincia,
        pec: profile.pec ?? "",
        codiceSdi: profile.codiceSdi ?? "",
        iban: profile.iban ?? "",
        annoInizioAttivita: profile.annoInizioAttivita,
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = (field: keyof ProfileFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profileTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("settings.ragioneSociale")}</Label>
              <Input value={form.ragioneSociale} onChange={(e) => update("ragioneSociale", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.partitaIva")}</Label>
              <Input value={form.partitaIva} onChange={(e) => update("partitaIva", e.target.value)} maxLength={11} required />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.codiceFiscale")}</Label>
              <Input value={form.codiceFiscale} onChange={(e) => update("codiceFiscale", e.target.value)} maxLength={16} required />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.codiceAteco")}</Label>
              <Input value={form.codiceAteco} onChange={(e) => update("codiceAteco", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>{t("settings.indirizzo")}</Label>
              <Input value={form.indirizzo} onChange={(e) => update("indirizzo", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.cap")}</Label>
              <Input value={form.cap} onChange={(e) => update("cap", e.target.value)} maxLength={5} required />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.citta")}</Label>
              <Input value={form.citta} onChange={(e) => update("citta", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.provincia")}</Label>
              <Input value={form.provincia} onChange={(e) => update("provincia", e.target.value)} maxLength={2} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("settings.pec")}</Label>
              <Input value={form.pec} onChange={(e) => update("pec", e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.codiceSdi")}</Label>
              <Input value={form.codiceSdi} onChange={(e) => update("codiceSdi", e.target.value)} maxLength={7} />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.iban")}</Label>
              <Input value={form.iban} onChange={(e) => update("iban", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.annoInizioAttivita")}</Label>
              <Input value={form.annoInizioAttivita} onChange={(e) => update("annoInizioAttivita", parseInt(e.target.value) || 0)} type="number" required />
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("common.saving") : t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
```

**Step 4: Update Settings page**

```tsx
// apps/web/src/pages/Settings.tsx
import { useTranslation } from "react-i18next";
import { ProfileForm } from "@/components/ProfileForm";
import { useProfile, useSaveProfile } from "@/hooks/use-profile";

export function Settings() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const saveProfile = useSaveProfile();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">{t("settings.title")}</h1>
      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <ProfileForm
          profile={profile}
          onSubmit={(data) => saveProfile.mutate(data)}
          isLoading={saveProfile.isPending}
        />
      )}
    </div>
  );
}
```

**Step 5: Add i18n translations**

Add to `apps/web/src/i18n/locales/it.json` under `"settings"`:
```json
{
  "settings": {
    "title": "Impostazioni",
    "profileTitle": "Profilo Attività",
    "ragioneSociale": "Ragione Sociale",
    "partitaIva": "Partita IVA",
    "codiceFiscale": "Codice Fiscale",
    "codiceAteco": "Codice ATECO",
    "indirizzo": "Indirizzo",
    "cap": "CAP",
    "citta": "Città",
    "provincia": "Provincia",
    "pec": "PEC",
    "codiceSdi": "Codice SDI",
    "iban": "IBAN",
    "annoInizioAttivita": "Anno Inizio Attività"
  }
}
```

Add to `apps/web/src/i18n/locales/en.json` under `"settings"`:
```json
{
  "settings": {
    "title": "Settings",
    "profileTitle": "Business Profile",
    "ragioneSociale": "Business Name",
    "partitaIva": "VAT Number",
    "codiceFiscale": "Tax Code",
    "codiceAteco": "ATECO Code",
    "indirizzo": "Address",
    "cap": "ZIP Code",
    "citta": "City",
    "provincia": "Province",
    "pec": "PEC Email",
    "codiceSdi": "SDI Code",
    "iban": "IBAN",
    "annoInizioAttivita": "Year Business Started"
  }
}
```

Also add to `"common"` in both files:
- IT: `"saving": "Salvataggio..."`, `"save": "Salva"`
- EN: `"saving": "Saving..."`, `"save": "Save"`

**Step 6: Run type check**

Run: `pnpm type-check`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/src/routes/profile.ts apps/api/src/server.ts apps/web/src/pages/Settings.tsx apps/web/src/hooks/use-profile.ts apps/web/src/components/ProfileForm.tsx apps/web/src/i18n/locales/
git commit -m "feat: settings page with user profile form + API endpoint"
```

---

### Task 11: Invoice Detail — Download Buttons & Validation UI

**Files:**
- Modify: `apps/web/src/pages/InvoiceDetail.tsx`
- Modify: `apps/web/src/hooks/use-invoices.ts` (add validation hook)
- Modify: `apps/web/src/lib/api.ts` (add download helper)

**Step 1: Add download helper to API client**

Add to `apps/web/src/lib/api.ts`:

```ts
async function downloadFile(path: string, filename: string): Promise<void> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error || "Download failed", body.details);
  }

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

Add `download: downloadFile` to the `api` export object.

**Step 2: Add validation hook**

Add to `apps/web/src/hooks/use-invoices.ts`:

```ts
export interface ValidationError {
  code: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function useValidateInvoice(id: string) {
  return useQuery<ValidationResult>({
    queryKey: ["invoices", id, "validate"],
    queryFn: () => api.get<ValidationResult>(`/invoices/${id}/xml/validate`),
    enabled: false, // only run on demand
  });
}
```

**Step 3: Update InvoiceDetail page**

```tsx
// apps/web/src/pages/InvoiceDetail.tsx
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { InvoicePreview } from "@/components/InvoicePreview";
import { useInvoice, useValidateInvoice } from "@/hooks/use-invoices";
import { useClient } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileCheck, FileDown, FileText, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useState } from "react";

export function InvoiceDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading, isError } = useInvoice(id ?? "");
  const { data: client } = useClient(invoice?.clientId ?? "");
  const { data: profile } = useProfile();
  const { data: validation, refetch: validate, isFetching: isValidating } = useValidateInvoice(id ?? "");
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  if (isError || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{t("common.error")}</p>
      </div>
    );
  }

  const handleValidate = () => {
    setDownloadError(null);
    validate();
  };

  const handleDownloadXml = async () => {
    try {
      setDownloadError(null);
      const filename = `IT${profile?.partitaIva}_${invoice.numeroFattura.toString().padStart(5, "0")}.xml`;
      await api.download(`/invoices/${id}/xml`, filename);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadError(null);
      await api.download(`/invoices/${id}/pdf`, `Fattura_${invoice.numeroFattura}_${invoice.anno}.pdf`);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const hasProfile = !!profile;
  const isValid = validation?.valid === true;
  const hasValidated = validation !== undefined;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Fattura {invoice.numeroFattura}/{invoice.anno}
        </h1>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={handleValidate} disabled={isValidating || !hasProfile}>
          <FileCheck className="h-4 w-4 mr-2" />
          {t("invoices.validate")}
        </Button>
        <Button variant="outline" onClick={handleDownloadXml} disabled={!hasProfile || (hasValidated && !isValid)}>
          <FileDown className="h-4 w-4 mr-2" />
          {t("invoices.downloadXml")}
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf} disabled={!hasProfile}>
          <FileText className="h-4 w-4 mr-2" />
          {t("invoices.downloadPdf")}
        </Button>
      </div>

      {/* Missing profile banner */}
      {!hasProfile && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t("invoices.missingProfile")}{" "}
            <a href="/settings" className="underline font-medium">{t("invoices.goToSettings")}</a>
          </span>
        </div>
      )}

      {/* Validation errors */}
      {validation && !validation.valid && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-semibold text-red-800 mb-2">{t("invoices.validationErrors")}</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validation.errors.map((err, i) => (
              <li key={i}>• {err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation success */}
      {validation?.valid && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{t("invoices.validationSuccess")}</p>
        </div>
      )}

      {/* Download error */}
      {downloadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{downloadError}</p>
        </div>
      )}

      <InvoicePreview invoice={invoice} client={client} />
    </div>
  );
}
```

**Step 4: Add i18n keys**

Add to `invoices` section in both locale files:

IT:
```json
"validate": "Valida",
"downloadXml": "Scarica XML",
"downloadPdf": "Scarica PDF",
"missingProfile": "Completa il tuo profilo per generare fatture elettroniche.",
"goToSettings": "Vai alle impostazioni",
"validationErrors": "Errori di validazione",
"validationSuccess": "Fattura valida — pronta per il download XML."
```

EN:
```json
"validate": "Validate",
"downloadXml": "Download XML",
"downloadPdf": "Download PDF",
"missingProfile": "Complete your profile to generate electronic invoices.",
"goToSettings": "Go to settings",
"validationErrors": "Validation errors",
"validationSuccess": "Invoice valid — ready for XML download."
```

**Step 5: Run type check**

Run: `pnpm type-check`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/web/src/pages/InvoiceDetail.tsx apps/web/src/hooks/use-invoices.ts apps/web/src/lib/api.ts apps/web/src/i18n/locales/
git commit -m "feat(web): invoice download buttons with validation UI"
```

---

### Task 12: GitHub Actions CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the workflow file**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: fatturino
          POSTGRES_PASSWORD: fatturino
          POSTGRES_DB: fatturino_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Build packages
        run: pnpm build

      - name: Push DB schema
        run: pnpm db:push
        env:
          DATABASE_URL: postgresql://fatturino:fatturino@localhost:5432/fatturino_test

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          CI: true
          DATABASE_URL: postgresql://fatturino:fatturino@localhost:5432/fatturino_test
          CORS_ORIGINS: http://localhost:5173
          BETTER_AUTH_SECRET: ci-test-secret-at-least-32-chars-long

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

**Step 2: Verify workflow syntax**

Run: `cd /Users/iba/Freelance/fatturino && cat .github/workflows/ci.yml | head -5`
Expected: File exists and starts with `name: CI`

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for PR testing"
```

---

### Task 13: E2E Tests for XML/PDF Download Flow

**Files:**
- Create: `e2e/invoice-xml.spec.ts`

**Step 1: Write E2E tests**

```ts
// e2e/invoice-xml.spec.ts
import { test, expect } from "@playwright/test";

// These tests assume a user is registered, has a profile, a client, and an invoice.
// They should run after the existing auth + invoice E2E setup.

test.describe("Invoice XML & PDF", () => {
  test.beforeEach(async ({ page }) => {
    // Login (reuse existing auth pattern from e2e/auth.spec.ts)
    await page.goto("/login");
    await page.fill('[data-testid="email"]', "test@example.com");
    await page.fill('[data-testid="password"]', "password123");
    await page.click('[data-testid="login-button"]');
    await page.waitForURL("/");
  });

  test("should show missing profile banner when profile not set", async ({ page }) => {
    // Navigate to an invoice detail
    await page.goto("/invoices");
    await page.click("table tbody tr:first-child a");

    // Should show missing profile warning
    await expect(page.getByText(/completa il tuo profilo/i)).toBeVisible();

    // Download buttons should be disabled
    await expect(page.getByRole("button", { name: /scarica xml/i })).toBeDisabled();
  });

  test("should validate and download XML after profile setup", async ({ page }) => {
    // First set up profile
    await page.goto("/settings");
    await page.fill('input[name="ragioneSociale"]', "Test User");
    await page.fill('input[name="partitaIva"]', "01234567890");
    await page.fill('input[name="codiceFiscale"]', "RSSMRA85M01H501Z");
    await page.fill('input[name="codiceAteco"]', "62.01.00");
    await page.fill('input[name="indirizzo"]', "Via Test 1");
    await page.fill('input[name="cap"]', "00100");
    await page.fill('input[name="citta"]', "Roma");
    await page.fill('input[name="provincia"]', "RM");
    await page.fill('input[name="annoInizioAttivita"]', "2020");
    await page.click('button[type="submit"]');

    // Navigate to invoice detail
    await page.goto("/invoices");
    await page.click("table tbody tr:first-child a");

    // Validate button should work
    const validateBtn = page.getByRole("button", { name: /valida/i });
    await validateBtn.click();

    // Should show validation result (success or errors)
    await expect(
      page.getByText(/pronta per il download|errori di validazione/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should download PDF", async ({ page }) => {
    await page.goto("/invoices");
    await page.click("table tbody tr:first-child a");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /scarica pdf/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/Fattura_.*\.pdf$/);
  });
});
```

Note: These E2E tests will need adjustment based on the exact test data setup. The existing `e2e/auth.spec.ts` and `e2e/clients.spec.ts` patterns should be followed for user registration and data creation. The implementer should check those files and adapt the `beforeEach` setup accordingly.

**Step 2: Run E2E tests locally**

Run: `pnpm test:e2e --grep "Invoice XML"`
Expected: Tests should pass (after dev servers are running)

**Step 3: Commit**

```bash
git add e2e/invoice-xml.spec.ts
git commit -m "test(e2e): add E2E tests for invoice XML/PDF download flow"
```

---

### Task 14: Final Integration — Build, Test, Verify

**Step 1: Build all packages**

Run: `pnpm build`
Expected: All packages build successfully including `@fatturino/fattura-xml`

**Step 2: Run all unit tests**

Run: `pnpm test`
Expected: All tests pass across all packages

**Step 3: Run E2E tests**

Run: `pnpm test:e2e`
Expected: All E2E tests pass (existing + new)

**Step 4: Type check**

Run: `pnpm type-check`
Expected: No type errors

**Step 5: Final commit if any loose ends**

```bash
git add -A
git commit -m "chore: phase 3 integration — build and test verification"
```
