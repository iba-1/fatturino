import { ALIQUOTA_STARTUP, ALIQUOTA_ORDINARIA } from "../constants/tax-rates.js";
import { getCoefficiente } from "./coefficienti.js";

export interface CalcoloImpostaInput {
  /** Total revenue for the year (€) */
  fatturato: number;
  /** ATECO code */
  codiceAteco: string;
  /** INPS contributions paid during the year (€) */
  contributiInpsVersati: number;
  /** Year the activity started */
  annoInizioAttivita: number;
  /** Current tax year */
  annoFiscale: number;
}

export interface CalcoloImpostaResult {
  /** Revenue × coefficiente di redditività */
  redditoLordo: number;
  /** Coefficiente used (%) */
  coefficienteRedditivita: number;
  /** Reddito lordo − INPS contributions (minimum 0) */
  redditoImponibile: number;
  /** Tax rate applied (5% or 15%) */
  aliquota: number;
  /** Whether startup rate applies */
  isStartup: boolean;
  /** Tax due = redditoImponibile × aliquota */
  impostaDovuta: number;
}

/**
 * Calculate imposta sostitutiva for Regime Forfettario.
 *
 * Formula:
 *   Reddito lordo = Fatturato × Coefficiente di redditività
 *   Reddito imponibile = Reddito lordo − Contributi INPS versati
 *   Imposta = Reddito imponibile × Aliquota (5% or 15%)
 */
export function calcolaImposta(input: CalcoloImpostaInput): CalcoloImpostaResult {
  const coefficiente = getCoefficiente(input.codiceAteco);
  if (coefficiente === null) {
    throw new Error(`Unknown ATECO code: ${input.codiceAteco}`);
  }

  const redditoLordo = Math.round((input.fatturato * coefficiente) / 100 * 100) / 100;

  const redditoImponibile = Math.max(
    0,
    Math.round((redditoLordo - input.contributiInpsVersati) * 100) / 100
  );

  const yearsActive = input.annoFiscale - input.annoInizioAttivita;
  const isStartup = yearsActive < 5;
  const aliquota = isStartup ? ALIQUOTA_STARTUP : ALIQUOTA_ORDINARIA;

  const impostaDovuta = Math.round((redditoImponibile * aliquota) / 100 * 100) / 100;

  return {
    redditoLordo,
    coefficienteRedditivita: coefficiente,
    redditoImponibile,
    aliquota,
    isStartup,
    impostaDovuta,
  };
}
