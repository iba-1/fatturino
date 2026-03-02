import type { CedenteData, CessionarioData } from "../types.js";

interface IdFiscaleIVA {
  IdPaese: string;
  IdCodice: string;
}

interface DatiTrasmissione {
  IdTrasmittente: IdFiscaleIVA;
  FormatoTrasmissione: string;
  CodiceDestinatario: string;
  PECDestinatario?: string;
}

interface Anagrafica {
  Denominazione?: string;
  Nome?: string;
  Cognome?: string;
}

interface CessionarioDatiAnagrafici {
  IdFiscaleIVA?: IdFiscaleIVA;
  CodiceFiscale: string;
  Anagrafica: Anagrafica;
}

export function buildHeader(cedente: CedenteData, cessionario: CessionarioData) {
  return {
    DatiTrasmissione: buildDatiTrasmissione(cedente, cessionario),
    CedentePrestatore: buildCedentePrestatore(cedente),
    CessionarioCommittente: buildCessionarioCommittente(cessionario),
  };
}

function buildDatiTrasmissione(cedente: CedenteData, cessionario: CessionarioData): DatiTrasmissione {
  const dt: DatiTrasmissione = {
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
  const anagrafica: Anagrafica = {};

  if (cessionario.tipo === "persona_giuridica") {
    anagrafica.Denominazione = cessionario.ragioneSociale!;
  } else {
    anagrafica.Nome = cessionario.nome!;
    anagrafica.Cognome = cessionario.cognome!;
  }

  const datiAnagrafici: CessionarioDatiAnagrafici = {
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
