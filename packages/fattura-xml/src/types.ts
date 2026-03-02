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
