import {
  ALIQUOTA_GESTIONE_SEPARATA,
  SCONTO_FORFETTARI_ARTIGIANI_COMMERCIANTI,
} from "../constants/tax-rates.js";
import { getCoefficiente } from "./coefficienti.js";

export type GestioneInps = "separata" | "artigiani" | "commercianti";

export interface CalcoloInpsInput {
  /** Total revenue for the year (€) */
  fatturato: number;
  /** ATECO code */
  codiceAteco: string;
  /** Type of INPS management */
  gestione: GestioneInps;
}

export interface CalcoloInpsResult {
  /** Base imponibile (reddito lordo) */
  baseImponibile: number;
  /** Rate applied (%) */
  aliquota: number;
  /** Fixed annual contribution (for artigiani/commercianti) */
  contributoFisso: number;
  /** Variable contribution on income exceeding minimale */
  contributoEccedenza: number;
  /** Total INPS due */
  totaleDovuto: number;
}

/**
 * 2024 INPS parameters for Artigiani/Commercianti.
 * These rates are updated yearly by INPS circular.
 */
const ARTIGIANI_COMMERCIANTI_2024 = {
  /** Minimale di reddito (€) */
  minimale: 18_415,
  /** Fixed contribution on minimale */
  contributoFissoArtigiani: 4_427.04,
  contributoFissoCommercianti: 4_515.43,
  /** Rate on income exceeding minimale (before forfettari discount) */
  aliquotaArtigiani: 24.0,
  aliquotaCommercianti: 24.48,
  /** Maximum income ceiling (€) */
  massimale: 55_008,
};

/**
 * Calculate INPS contributions for Regime Forfettario.
 *
 * Gestione Separata (professionisti senza cassa):
 *   Contributo = Reddito lordo × 26.07%
 *
 * Artigiani/Commercianti:
 *   Fixed contribution on minimale + variable on exceeding income.
 *   Forfettari get a 35% discount on both fixed and variable parts.
 */
export function calcolaInps(input: CalcoloInpsInput): CalcoloInpsResult {
  const coefficiente = getCoefficiente(input.codiceAteco);
  if (coefficiente === null) {
    throw new Error(`Unknown ATECO code: ${input.codiceAteco}`);
  }

  const baseImponibile = Math.round((input.fatturato * coefficiente) / 100 * 100) / 100;

  if (input.gestione === "separata") {
    const totaleDovuto =
      Math.round((baseImponibile * ALIQUOTA_GESTIONE_SEPARATA) / 100 * 100) / 100;

    return {
      baseImponibile,
      aliquota: ALIQUOTA_GESTIONE_SEPARATA,
      contributoFisso: 0,
      contributoEccedenza: 0,
      totaleDovuto,
    };
  }

  // Artigiani or Commercianti
  const params = ARTIGIANI_COMMERCIANTI_2024;
  const isArtigiano = input.gestione === "artigiani";
  const contributoFissoPieno = isArtigiano
    ? params.contributoFissoArtigiani
    : params.contributoFissoCommercianti;
  const aliquotaPiena = isArtigiano
    ? params.aliquotaArtigiani
    : params.aliquotaCommercianti;

  // Apply 35% discount for forfettari
  const sconto = (100 - SCONTO_FORFETTARI_ARTIGIANI_COMMERCIANTI) / 100;
  const contributoFisso = Math.round(contributoFissoPieno * sconto * 100) / 100;

  let contributoEccedenza = 0;
  if (baseImponibile > params.minimale) {
    const eccedenza = Math.min(baseImponibile, params.massimale) - params.minimale;
    contributoEccedenza =
      Math.round(eccedenza * (aliquotaPiena / 100) * sconto * 100) / 100;
  }

  const totaleDovuto = Math.round((contributoFisso + contributoEccedenza) * 100) / 100;

  return {
    baseImponibile,
    aliquota: aliquotaPiena * sconto,
    contributoFisso,
    contributoEccedenza,
    totaleDovuto,
  };
}
