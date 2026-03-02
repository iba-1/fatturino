import { DISCLAIMER_FORFETTARIO } from "@fatturino/shared";
import type { DatiGeneraliData, DettaglioLineaData } from "../types.js";

export function buildBody(datiGenerali: DatiGeneraliData, linee: DettaglioLineaData[]) {
  const imponibile = linee.reduce((sum, l) => sum + l.prezzoTotale, 0);
  const bolloAmount = datiGenerali.importoBollo ?? 0;
  const totalePagamento = imponibile + bolloAmount;

  return {
    DatiGenerali: {
      DatiGeneraliDocumento: buildDatiGeneraliDocumento(datiGenerali),
    },
    DatiBeniServizi: {
      DettaglioLinee: linee.map(buildDettaglioLinea),
      DatiRiepilogo: buildDatiRiepilogo(linee),
    },
    DatiPagamento: {
      CondizioniPagamento: "TP02",
      DettaglioPagamento: {
        ModalitaPagamento: "MP05",
        ImportoPagamento: totalePagamento.toFixed(2),
      },
    },
  };
}

function buildDatiGeneraliDocumento(dati: DatiGeneraliData) {
  const doc: Record<string, unknown> = {
    TipoDocumento: dati.tipoDocumento,
    Divisa: dati.divisa,
    Data: dati.data,
    Numero: dati.numero,
  };

  if (dati.importoBollo) {
    doc.DatiBollo = {
      BolloVirtuale: "SI",
      ImportoBollo: dati.importoBollo.toFixed(2),
    };
  }

  if (dati.causale) {
    doc.Causale = dati.causale;
  }

  return doc;
}

function buildDettaglioLinea(linea: DettaglioLineaData) {
  return {
    NumeroLinea: linea.numeroLinea,
    Descrizione: linea.descrizione,
    Quantita: linea.quantita.toFixed(2),
    PrezzoUnitario: linea.prezzoUnitario.toFixed(2),
    PrezzoTotale: linea.prezzoTotale.toFixed(2),
    AliquotaIVA: linea.aliquotaIva.toFixed(2),
    Natura: linea.natura,
  };
}

function buildDatiRiepilogo(linee: DettaglioLineaData[]) {
  const groups = new Map<string, { aliquota: number; natura?: string; imponibile: number }>();

  for (const linea of linee) {
    const key = `${linea.aliquotaIva}-${linea.natura ?? ""}`;
    const existing = groups.get(key);
    if (existing) {
      existing.imponibile += linea.prezzoTotale;
    } else {
      groups.set(key, {
        aliquota: linea.aliquotaIva,
        natura: linea.natura,
        imponibile: linea.prezzoTotale,
      });
    }
  }

  return Array.from(groups.values()).map((g) => {
    const riepilogo: Record<string, string> = {
      AliquotaIVA: g.aliquota.toFixed(2),
      ImponibileImporto: g.imponibile.toFixed(2),
      Imposta: ((g.imponibile * g.aliquota) / 100).toFixed(2),
    };

    if (g.natura) {
      riepilogo.Natura = g.natura;
      riepilogo.RiferimentoNormativo = DISCLAIMER_FORFETTARIO;
    }

    return riepilogo;
  });
}
