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
}

export interface AccontoSaldoResult {
  /** First advance payment (50% of total) — due June 30 */
  primoAcconto: number;
  /** Second advance payment (50% of total) — due November 30 */
  secondoAcconto: number;
  /** Balance payment — due June 30 of following year */
  saldo: number;
}

/**
 * Calculate acconto/saldo breakdown for imposta sostitutiva.
 *
 * Acconti are based on prior year's tax:
 *   - Primo acconto: 50% (due June 30)
 *   - Secondo acconto: 50% (due November 30)
 *   - Saldo: difference between actual tax and acconti paid
 */
export function calcolaAccontoSaldo(input: AccontoSaldoInput): AccontoSaldoResult {
  const primoAcconto = Math.round((input.impostaDovuta * 50) / 100 * 100) / 100;
  const secondoAcconto = Math.round((input.impostaDovuta * 50) / 100 * 100) / 100;
  const saldo = Math.max(
    0,
    Math.round((input.impostaDovuta - input.accontiVersati) * 100) / 100
  );

  return { primoAcconto, secondoAcconto, saldo };
}

/**
 * Generate F24 Sezione Erario rows for imposta sostitutiva payments.
 */
export function generaRigheErario(
  impostaDovuta: number,
  anno: number
): F24SezioneErarioRiga[] {
  const primoAcconto = Math.round((impostaDovuta * 50) / 100 * 100) / 100;
  const secondoAcconto = Math.round((impostaDovuta * 50) / 100 * 100) / 100;

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
