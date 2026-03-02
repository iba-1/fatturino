import type { FatturaInput } from "@fatturino/fattura-xml";

export function mapToFatturaInput(
  userProfile: {
    partitaIva: string;
    codiceFiscale: string;
    ragioneSociale: string;
    regimeFiscale: string;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
  },
  client: {
    tipo: "persona_fisica" | "persona_giuridica";
    partitaIva: string | null;
    codiceFiscale: string;
    ragioneSociale: string | null;
    nome: string | null;
    cognome: string | null;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
    nazione: string;
    codiceSdi: string | null;
    pec: string | null;
  },
  invoice: {
    tipoDocumento: string;
    dataEmissione: Date;
    numeroFattura: number;
    causale: string | null;
    imponibile: string;
    impostaBollo: string;
  },
  lines: Array<{
    descrizione: string;
    quantita: string;
    prezzoUnitario: string;
    prezzoTotale: string;
    aliquotaIva: string;
    naturaIva: string | null;
  }>
): FatturaInput {
  const bollo = parseFloat(invoice.impostaBollo);

  return {
    cedente: {
      partitaIva: userProfile.partitaIva,
      codiceFiscale: userProfile.codiceFiscale,
      ragioneSociale: userProfile.ragioneSociale,
      regimeFiscale: userProfile.regimeFiscale,
      indirizzo: userProfile.indirizzo,
      cap: userProfile.cap,
      citta: userProfile.citta,
      provincia: userProfile.provincia,
      nazione: "IT",
    },
    cessionario: {
      tipo: client.tipo,
      partitaIva: client.partitaIva ?? undefined,
      codiceFiscale: client.codiceFiscale,
      ragioneSociale: client.ragioneSociale ?? undefined,
      nome: client.nome ?? undefined,
      cognome: client.cognome ?? undefined,
      indirizzo: client.indirizzo,
      cap: client.cap,
      citta: client.citta,
      provincia: client.provincia,
      nazione: client.nazione,
      codiceSdi: client.codiceSdi ?? undefined,
      pec: client.pec ?? undefined,
    },
    datiGenerali: {
      tipoDocumento: invoice.tipoDocumento,
      divisa: "EUR",
      data: invoice.dataEmissione.toISOString().split("T")[0],
      numero: invoice.numeroFattura.toString(),
      causale: invoice.causale ?? undefined,
      importoBollo: bollo > 0 ? bollo : undefined,
    },
    linee: lines.map((line, i) => ({
      numeroLinea: i + 1,
      descrizione: line.descrizione,
      quantita: parseFloat(line.quantita),
      prezzoUnitario: parseFloat(line.prezzoUnitario),
      prezzoTotale: parseFloat(line.prezzoTotale),
      aliquotaIva: parseFloat(line.aliquotaIva),
      natura: line.naturaIva ?? "N2.2",
    })),
  };
}
