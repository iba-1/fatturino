import {
  CODICI_TRIBUTO_IMPOSTA,
  CAUSALI_CONTRIBUTO_SEPARATA,
  CAUSALI_CONTRIBUTO_ARTIGIANI,
  CAUSALI_CONTRIBUTO_COMMERCIANTI,
} from "../constants/codici-tributo.js";
import type { GestioneInps } from "./inps.js";

export interface F24SezioneErarioRiga {
  codiceTributo: string;
  rateazione: string;
  annoDiRiferimento: number;
  importoADebito: number;
  importoACredito: number;
}

export interface F24SezioneInpsRiga {
  codiceSede: string;
  causaleContributo: string;
  matricola: string;
  periodoRiferimentoDa: string;
  periodoRiferimentoA: string;
  importoADebito: number;
  importoACredito: number;
}

export interface F24Data {
  codiceFiscale: string;
  annoRiferimento: number;
  sezioneErario: F24SezioneErarioRiga[];
  sezioneInps: F24SezioneInpsRiga[];
  totale: number;
}

export interface AccontoSaldoInput {
  /** Total tax due for the year */
  impostaDovuta: number;
  /** Advances already paid during the year */
  accontiVersati: number;
  /** Tax year */
  anno: number;
  /** First year of activity — no acconti due (no prior year reference) */
  primoAnno?: boolean;
}

export interface AccontoSaldoResult {
  /** First advance payment (40% of total) — due June 30 */
  primoAcconto: number;
  /** Second advance payment (60% of total) — due November 30 */
  secondoAcconto: number;
  /** Balance payment — due June 30 of following year */
  saldo: number;
}

/**
 * Calculate acconto/saldo breakdown for imposta sostitutiva.
 *
 * Acconti are based on prior year's tax (metodo storico):
 *   - < €52: no acconti
 *   - €52 – €257.52: single payment (100%) due November 30
 *   - > €257.52: primo acconto 40% (June 30) + secondo acconto 60% (November 30)
 *   - First year (primoAnno): no acconti, only saldo
 */
/** Minimum tax threshold below which no acconti are due */
export const SOGLIA_MINIMA_ACCONTI = 51.65;
/** Threshold above which acconti are split into two payments (40/60) */
export const SOGLIA_DOPPIO_ACCONTO = 257.52;

export function calcolaAccontoSaldo(input: AccontoSaldoInput): AccontoSaldoResult {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const saldo = Math.max(0, round2(input.impostaDovuta - input.accontiVersati));

  // First year: no acconti (no prior year reference)
  if (input.primoAnno) {
    return { primoAcconto: 0, secondoAcconto: 0, saldo };
  }

  // Below €52: no advance payments required
  if (input.impostaDovuta < SOGLIA_MINIMA_ACCONTI) {
    return { primoAcconto: 0, secondoAcconto: 0, saldo };
  }

  // €52 – €257.52: single payment due November 30
  if (input.impostaDovuta <= SOGLIA_DOPPIO_ACCONTO) {
    return {
      primoAcconto: 0,
      secondoAcconto: round2(input.impostaDovuta),
      saldo,
    };
  }

  // > €257.52: two payments — 40% June + 60% November
  const primoAcconto = round2(input.impostaDovuta * 40 / 100);
  const secondoAcconto = round2(input.impostaDovuta * 60 / 100);

  return { primoAcconto, secondoAcconto, saldo };
}

// ---------------------------------------------------------------------------
// INPS Gestione Separata — acconto calculation
// ---------------------------------------------------------------------------

export interface AccontiInpsInput {
  /** Prior year's total INPS contributions */
  inpsPrecedente: number;
  /** Actual INPS due for current year (for saldo calculation) */
  inpsEffettivo?: number;
  /** First year of activity — no acconti */
  primoAnno?: boolean;
}

export interface AccontiInpsResult {
  /** First advance (40% of prior year) — due June 30 */
  primoAcconto: number;
  /** Second advance (40% of prior year) — due November 30 */
  secondoAcconto: number;
  /** Total acconti (80% of prior year) */
  totaleAcconti: number;
  /** Balance: actual INPS − acconti paid (can be negative = credit) */
  saldo: number;
}

/**
 * Calculate INPS Gestione Separata acconto/saldo breakdown.
 *
 * Acconti = 80% of prior year's INPS, split equally:
 *   - Primo acconto: 40% of prior year (June 30)
 *   - Secondo acconto: 40% of prior year (November 30)
 *   - Saldo: actual − 80% already paid (can be negative = credit)
 */
export function calcolaAccontiInps(input: AccontiInpsInput): AccontiInpsResult {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  if (input.primoAnno || input.inpsPrecedente <= 0) {
    const saldo = input.inpsEffettivo != null ? round2(input.inpsEffettivo) : 0;
    return { primoAcconto: 0, secondoAcconto: 0, totaleAcconti: 0, saldo };
  }

  const primoAcconto = round2(input.inpsPrecedente * 40 / 100);
  const secondoAcconto = round2(input.inpsPrecedente * 40 / 100);
  const totaleAcconti = round2(primoAcconto + secondoAcconto);

  const saldo = input.inpsEffettivo != null
    ? round2(input.inpsEffettivo - totaleAcconti)
    : 0;

  return { primoAcconto, secondoAcconto, totaleAcconti, saldo };
}

/**
 * Generate F24 Sezione Erario rows for imposta sostitutiva payments.
 */
export function generaRigheErario(
  impostaDovuta: number,
  anno: number
): F24SezioneErarioRiga[] {
  const primoAcconto = Math.round((impostaDovuta * 40) / 100 * 100) / 100;
  const secondoAcconto = Math.round((impostaDovuta * 60) / 100 * 100) / 100;

  return [
    {
      codiceTributo: CODICI_TRIBUTO_IMPOSTA.ACCONTO_PRIMO,
      rateazione: "0101",
      annoDiRiferimento: anno,
      importoADebito: primoAcconto,
      importoACredito: 0,
    },
    {
      codiceTributo: CODICI_TRIBUTO_IMPOSTA.ACCONTO_SECONDO,
      rateazione: "0101",
      annoDiRiferimento: anno,
      importoADebito: secondoAcconto,
      importoACredito: 0,
    },
    {
      codiceTributo: CODICI_TRIBUTO_IMPOSTA.SALDO,
      rateazione: "0101",
      annoDiRiferimento: anno,
      importoADebito: impostaDovuta,
      importoACredito: 0,
    },
  ];
}

export interface GeneraRigheInpsInput {
  gestione: GestioneInps;
  /** Total INPS due for the year */
  totaleDovuto: number;
  /** Fixed contribution (artigiani/commercianti only) */
  contributoFisso: number;
  /** Contribution on income exceeding minimale (artigiani/commercianti only) */
  contributoEccedenza: number;
  /** Tax year */
  anno: number;
  /** INPS sede code (default: blank) */
  codiceSede?: string;
  /** INPS matricola (default: blank) */
  matricola?: string;
}

/**
 * Generate F24 Sezione INPS rows for contribution payments.
 *
 * Gestione Separata: single row with causale PXX and total amount.
 * Artigiani: up to 2 rows — AF (fissi) + AP (eccedenza).
 * Commercianti: up to 2 rows — CF (fissi) + CP (eccedenza).
 */
export function generaRigheInps(input: GeneraRigheInpsInput): F24SezioneInpsRiga[] {
  const { gestione, anno, codiceSede = "", matricola = "" } = input;
  const periodoRiferimentoDa = `01/${anno}`;
  const periodoRiferimentoA = `12/${anno}`;

  if (gestione === "separata") {
    if (input.totaleDovuto <= 0) return [];
    return [
      {
        codiceSede,
        causaleContributo: CAUSALI_CONTRIBUTO_SEPARATA.SALDO_ACCONTO,
        matricola,
        periodoRiferimentoDa,
        periodoRiferimentoA,
        importoADebito: input.totaleDovuto,
        importoACredito: 0,
      },
    ];
  }

  const causali =
    gestione === "artigiani"
      ? CAUSALI_CONTRIBUTO_ARTIGIANI
      : CAUSALI_CONTRIBUTO_COMMERCIANTI;

  const rows: F24SezioneInpsRiga[] = [];

  if (input.contributoFisso > 0) {
    rows.push({
      codiceSede,
      causaleContributo: causali.FISSI,
      matricola,
      periodoRiferimentoDa,
      periodoRiferimentoA,
      importoADebito: input.contributoFisso,
      importoACredito: 0,
    });
  }

  if (input.contributoEccedenza > 0) {
    rows.push({
      codiceSede,
      causaleContributo: causali.ECCEDENZA,
      matricola,
      periodoRiferimentoDa,
      periodoRiferimentoA,
      importoADebito: input.contributoEccedenza,
      importoACredito: 0,
    });
  }

  return rows;
}
