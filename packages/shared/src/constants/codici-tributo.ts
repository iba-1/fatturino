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

/** INPS Gestione Separata (non-pensionati) — causale contributo */
export const CAUSALI_CONTRIBUTO_SEPARATA = {
  /** Saldo e acconto (causale unica) */
  SALDO_ACCONTO: "PXX",
} as const;

/** INPS Artigiani — causale contributo */
export const CAUSALI_CONTRIBUTO_ARTIGIANI = {
  /** Contributi fissi su minimale */
  FISSI: "AF",
  /** Contributi su eccedenza minimale */
  ECCEDENZA: "AP",
} as const;

/** INPS Commercianti — causale contributo */
export const CAUSALI_CONTRIBUTO_COMMERCIANTI = {
  /** Contributi fissi su minimale */
  FISSI: "CF",
  /** Contributi su eccedenza minimale */
  ECCEDENZA: "CP",
} as const;

/** Tax payment deadlines (month-day) */
export const SCADENZE_FISCALI = {
  /** Saldo anno precedente + Acconto prima rata anno corrente */
  SALDO_E_PRIMO_ACCONTO: { month: 6, day: 30 },
  /** Acconto seconda rata anno corrente */
  SECONDO_ACCONTO: { month: 11, day: 30 },
} as const;
