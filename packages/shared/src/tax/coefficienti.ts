/**
 * Coefficienti di redditività per Regime Forfettario.
 * Maps ATECO code prefixes to their profitability coefficient (%).
 *
 * Source: Legge 190/2014, Allegato 4 (updated with Legge di Bilancio modifications).
 * The coefficient determines what percentage of revenue is considered taxable income.
 */

export interface CoefficienteAteco {
  /** ATECO code or prefix */
  codice: string;
  /** Description of the activity */
  descrizione: string;
  /** Profitability coefficient as percentage (e.g., 78 = 78%) */
  coefficiente: number;
}

/**
 * Full table of coefficienti di redditività.
 * Ordered by ATECO group for easy lookup.
 */
export const COEFFICIENTI_REDDITIVITA: CoefficienteAteco[] = [
  // Industrie alimentari e delle bevande
  { codice: "10", descrizione: "Industrie alimentari e delle bevande", coefficiente: 40 },
  { codice: "11", descrizione: "Industria delle bevande", coefficiente: 40 },

  // Commercio all'ingrosso e al dettaglio
  { codice: "45", descrizione: "Commercio e riparazione autoveicoli", coefficiente: 40 },
  { codice: "46", descrizione: "Commercio all'ingrosso", coefficiente: 40 },
  { codice: "47", descrizione: "Commercio al dettaglio", coefficiente: 40 },

  // Commercio ambulante di prodotti alimentari e bevande
  { codice: "47.81", descrizione: "Commercio ambulante alimentari", coefficiente: 40 },

  // Commercio ambulante di altri prodotti
  { codice: "47.82", descrizione: "Commercio ambulante altri prodotti", coefficiente: 54 },
  { codice: "47.89", descrizione: "Commercio ambulante altri prodotti", coefficiente: 54 },

  // Costruzioni e attività immobiliari
  { codice: "41", descrizione: "Costruzione di edifici", coefficiente: 86 },
  { codice: "42", descrizione: "Ingegneria civile", coefficiente: 86 },
  { codice: "43", descrizione: "Lavori di costruzione specializzati", coefficiente: 86 },
  { codice: "68", descrizione: "Attività immobiliari", coefficiente: 86 },

  // Intermediari del commercio
  { codice: "46.1", descrizione: "Intermediari del commercio", coefficiente: 62 },

  // Attività dei servizi di alloggio e di ristorazione
  { codice: "55", descrizione: "Alloggio", coefficiente: 40 },
  { codice: "56", descrizione: "Attività dei servizi di ristorazione", coefficiente: 40 },

  // Attività professionali, scientifiche, tecniche, sanitarie
  { codice: "64", descrizione: "Attività di servizi finanziari", coefficiente: 78 },
  { codice: "65", descrizione: "Assicurazioni", coefficiente: 78 },
  { codice: "66", descrizione: "Attività ausiliarie servizi finanziari", coefficiente: 78 },
  { codice: "69", descrizione: "Attività legali e contabilità", coefficiente: 78 },
  { codice: "70", descrizione: "Attività di direzione aziendale e consulenza", coefficiente: 78 },
  { codice: "71", descrizione: "Attività degli studi di architettura e ingegneria", coefficiente: 78 },
  { codice: "72", descrizione: "Ricerca scientifica e sviluppo", coefficiente: 78 },
  { codice: "73", descrizione: "Pubblicità e ricerche di mercato", coefficiente: 78 },
  { codice: "74", descrizione: "Altre attività professionali e tecniche", coefficiente: 78 },
  { codice: "75", descrizione: "Servizi veterinari", coefficiente: 78 },
  { codice: "85", descrizione: "Istruzione", coefficiente: 78 },
  { codice: "86", descrizione: "Assistenza sanitaria", coefficiente: 78 },
  { codice: "87", descrizione: "Servizi di assistenza sociale residenziale", coefficiente: 78 },
  { codice: "88", descrizione: "Assistenza sociale non residenziale", coefficiente: 78 },

  // Altre attività economiche (informatica, servizi, etc.)
  { codice: "01", descrizione: "Coltivazioni agricole", coefficiente: 67 },
  { codice: "02", descrizione: "Silvicoltura", coefficiente: 67 },
  { codice: "03", descrizione: "Pesca e acquacoltura", coefficiente: 67 },
  { codice: "05", descrizione: "Estrazione di carbone", coefficiente: 67 },
  { codice: "06", descrizione: "Estrazione petrolio e gas", coefficiente: 67 },
  { codice: "07", descrizione: "Estrazione di minerali metalliferi", coefficiente: 67 },
  { codice: "08", descrizione: "Altre attività di estrazione", coefficiente: 67 },
  { codice: "09", descrizione: "Attività dei servizi di supporto estrazione", coefficiente: 67 },
  { codice: "12", descrizione: "Industria del tabacco", coefficiente: 67 },
  { codice: "13", descrizione: "Industrie tessili", coefficiente: 67 },
  { codice: "14", descrizione: "Confezione di articoli di abbigliamento", coefficiente: 67 },
  { codice: "15", descrizione: "Fabbricazione articoli in pelle", coefficiente: 67 },
  { codice: "16", descrizione: "Industria del legno", coefficiente: 67 },
  { codice: "17", descrizione: "Fabbricazione di carta", coefficiente: 67 },
  { codice: "18", descrizione: "Stampa e riproduzione", coefficiente: 67 },
  { codice: "19", descrizione: "Fabbricazione di coke e prodotti petroliferi", coefficiente: 67 },
  { codice: "20", descrizione: "Fabbricazione di prodotti chimici", coefficiente: 67 },
  { codice: "21", descrizione: "Fabbricazione di prodotti farmaceutici", coefficiente: 67 },
  { codice: "22", descrizione: "Fabbricazione di articoli in gomma e plastica", coefficiente: 67 },
  { codice: "23", descrizione: "Fabbricazione di altri prodotti non metalliferi", coefficiente: 67 },
  { codice: "24", descrizione: "Metallurgia", coefficiente: 67 },
  { codice: "25", descrizione: "Fabbricazione di prodotti in metallo", coefficiente: 67 },
  { codice: "26", descrizione: "Fabbricazione di computer e prodotti elettronici", coefficiente: 67 },
  { codice: "27", descrizione: "Fabbricazione di apparecchiature elettriche", coefficiente: 67 },
  { codice: "28", descrizione: "Fabbricazione di macchinari", coefficiente: 67 },
  { codice: "29", descrizione: "Fabbricazione di autoveicoli", coefficiente: 67 },
  { codice: "30", descrizione: "Fabbricazione di altri mezzi di trasporto", coefficiente: 67 },
  { codice: "31", descrizione: "Fabbricazione di mobili", coefficiente: 67 },
  { codice: "32", descrizione: "Altre industrie manifatturiere", coefficiente: 67 },
  { codice: "33", descrizione: "Riparazione e installazione di macchine", coefficiente: 67 },
  { codice: "35", descrizione: "Fornitura di energia elettrica e gas", coefficiente: 67 },
  { codice: "36", descrizione: "Raccolta e fornitura di acqua", coefficiente: 67 },
  { codice: "37", descrizione: "Gestione delle reti fognarie", coefficiente: 67 },
  { codice: "38", descrizione: "Raccolta e smaltimento rifiuti", coefficiente: 67 },
  { codice: "39", descrizione: "Attività di risanamento", coefficiente: 67 },
  { codice: "49", descrizione: "Trasporto terrestre", coefficiente: 67 },
  { codice: "50", descrizione: "Trasporto marittimo", coefficiente: 67 },
  { codice: "51", descrizione: "Trasporto aereo", coefficiente: 67 },
  { codice: "52", descrizione: "Magazzinaggio e attività di supporto ai trasporti", coefficiente: 67 },
  { codice: "53", descrizione: "Servizi postali e di corriere", coefficiente: 67 },
  { codice: "58", descrizione: "Attività editoriali", coefficiente: 67 },
  { codice: "59", descrizione: "Produzione cinematografica e musicale", coefficiente: 67 },
  { codice: "60", descrizione: "Attività di programmazione e trasmissione", coefficiente: 67 },
  { codice: "61", descrizione: "Telecomunicazioni", coefficiente: 67 },
  { codice: "62", descrizione: "Produzione di software, consulenza informatica", coefficiente: 67 },
  { codice: "63", descrizione: "Attività dei servizi d'informazione", coefficiente: 67 },
  { codice: "77", descrizione: "Attività di noleggio e leasing", coefficiente: 67 },
  { codice: "78", descrizione: "Attività di ricerca e selezione del personale", coefficiente: 67 },
  { codice: "79", descrizione: "Attività dei servizi delle agenzie di viaggio", coefficiente: 67 },
  { codice: "80", descrizione: "Servizi di vigilanza e investigazione", coefficiente: 67 },
  { codice: "81", descrizione: "Attività di servizi per edifici e paesaggio", coefficiente: 67 },
  { codice: "82", descrizione: "Attività di supporto per le funzioni d'ufficio", coefficiente: 67 },
  { codice: "84", descrizione: "Amministrazione pubblica e difesa", coefficiente: 67 },
  { codice: "90", descrizione: "Attività creative, artistiche e di intrattenimento", coefficiente: 67 },
  { codice: "91", descrizione: "Attività di biblioteche, archivi e musei", coefficiente: 67 },
  { codice: "92", descrizione: "Attività riguardanti le lotterie", coefficiente: 67 },
  { codice: "93", descrizione: "Attività sportive e di intrattenimento", coefficiente: 67 },
  { codice: "94", descrizione: "Attività di organizzazioni associative", coefficiente: 67 },
  { codice: "95", descrizione: "Riparazione di computer e beni personali", coefficiente: 67 },
  { codice: "96", descrizione: "Altre attività di servizi per la persona", coefficiente: 67 },
  { codice: "97", descrizione: "Attività di famiglie come datori di lavoro", coefficiente: 67 },
  { codice: "98", descrizione: "Produzione di beni e servizi per uso proprio", coefficiente: 67 },
  { codice: "99", descrizione: "Organizzazioni ed organismi extraterritoriali", coefficiente: 67 },
];

/**
 * Find the coefficiente di redditività for a given ATECO code.
 * Performs longest-prefix match (e.g., "47.81" matches before "47").
 */
export function getCoefficiente(codiceAteco: string): number | null {
  const normalized = codiceAteco.replace(/\./g, "").trim();

  // Sort by code length descending for longest prefix match
  const sorted = [...COEFFICIENTI_REDDITIVITA].sort(
    (a, b) => b.codice.replace(/\./g, "").length - a.codice.replace(/\./g, "").length
  );

  for (const entry of sorted) {
    const entryNormalized = entry.codice.replace(/\./g, "");
    if (normalized.startsWith(entryNormalized)) {
      return entry.coefficiente;
    }
  }

  return null;
}
