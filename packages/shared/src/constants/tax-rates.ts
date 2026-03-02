/**
 * Tax rates and thresholds for Regime Forfettario.
 * Updated for fiscal year 2024/2025.
 */

/** Imposta sostitutiva rate for the first 5 years of activity */
export const ALIQUOTA_STARTUP = 5;

/** Imposta sostitutiva rate after the first 5 years */
export const ALIQUOTA_ORDINARIA = 15;

/** Revenue threshold for Regime Forfettario eligibility (€) */
export const SOGLIA_RICAVI_FORFETTARIO = 85_000;

/** Threshold above which imposta di bollo is mandatory (€) */
export const SOGLIA_BOLLO = 77.47;

/** Imposta di bollo amount (€) */
export const IMPORTO_BOLLO = 2.0;

/** INPS Gestione Separata rate for professionisti senza cassa (2024) */
export const ALIQUOTA_GESTIONE_SEPARATA = 26.07;

/** INPS discount percentage for forfettari on Artigiani/Commercianti */
export const SCONTO_FORFETTARI_ARTIGIANI_COMMERCIANTI = 35;

/** Natura IVA code for Regime Forfettario (non soggette - altri casi) */
export const NATURA_IVA_FORFETTARIO = "N2.2";

/** Regime fiscale code for Regime Forfettario */
export const REGIME_FISCALE_FORFETTARIO = "RF19";

/** Mandatory disclaimer for Regime Forfettario invoices */
export const DISCLAIMER_FORFETTARIO =
  "Operazione effettuata ai sensi dell'art.1, commi da 54 a 89, della Legge n. 190/2014 e successive modificazioni. Si richiede la non applicazione della ritenuta alla fonte a titolo d'acconto ai sensi dell'art. 1 comma 67 della Legge numero 190/2014.";

/** Invoice types (TipoDocumento) */
export const TIPO_DOCUMENTO = {
  TD01: "Fattura",
  TD02: "Acconto/Anticipo su fattura",
  TD03: "Acconto/Anticipo su parcella",
  TD04: "Nota di credito",
  TD05: "Nota di debito",
  TD06: "Parcella",
  TD24: "Fattura differita",
  TD25: "Fattura differita - triangolazione",
} as const;

/** Invoice statuses */
export const STATO_FATTURA = {
  BOZZA: "bozza",
  INVIATA: "inviata",
  CONSEGNATA: "consegnata",
  SCARTATA: "scartata",
  ACCETTATA: "accettata",
  RIFIUTATA: "rifiutata",
  MANCATA_CONSEGNA: "mancata_consegna",
} as const;
