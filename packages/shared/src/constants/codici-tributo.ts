/**
 * Codici tributo for F24 form payments.
 */

/** Imposta sostitutiva forfettari */
export const CODICI_TRIBUTO_IMPOSTA = {
  /** Acconto prima rata (June 30) */
  ACCONTO_PRIMO: "1790",
  /** Acconto seconda rata (November 30) */
  ACCONTO_SECONDO: "1791",
  /** Saldo (June 30 of following year) */
  SALDO: "1792",
} as const;

/** INPS Gestione Separata */
export const CODICI_TRIBUTO_INPS_SEPARATA = {
  /** Acconto prima rata */
  ACCONTO_PRIMO: "PXX",
  /** Acconto seconda rata */
  ACCONTO_SECONDO: "PXX",
  /** Saldo */
  SALDO: "PXX",
} as const;

/** Tax payment deadlines (month-day) */
export const SCADENZE_FISCALI = {
  /** Saldo anno precedente + Acconto prima rata anno corrente */
  SALDO_E_PRIMO_ACCONTO: { month: 6, day: 30 },
  /** Acconto seconda rata anno corrente */
  SECONDO_ACCONTO: { month: 11, day: 30 },
} as const;
