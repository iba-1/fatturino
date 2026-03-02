import { SOGLIA_BOLLO } from "@fatturino/shared";
import type { FatturaInput } from "../types.js";

export interface ValidationError {
  code: string;
  field: string;
  message: string;
}

const SUPPORTED_TIPI_DOCUMENTO = ["TD01", "TD04"];
const PARTITA_IVA_REGEX = /^\d{11}$/;

export function validateBusinessRules(input: FatturaInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (input.cedente.regimeFiscale !== "RF19") {
    errors.push({
      code: "INVALID_REGIME_FISCALE",
      field: "cedente.regimeFiscale",
      message: "Il regime fiscale deve essere RF19 (Regime Forfettario)",
    });
  }

  if (!SUPPORTED_TIPI_DOCUMENTO.includes(input.datiGenerali.tipoDocumento)) {
    errors.push({
      code: "UNSUPPORTED_TIPO_DOCUMENTO",
      field: "datiGenerali.tipoDocumento",
      message: `Tipo documento non supportato: ${input.datiGenerali.tipoDocumento}. Supportati: ${SUPPORTED_TIPI_DOCUMENTO.join(", ")}`,
    });
  }

  if (!PARTITA_IVA_REGEX.test(input.cedente.partitaIva)) {
    errors.push({
      code: "INVALID_PARTITA_IVA_CEDENTE",
      field: "cedente.partitaIva",
      message: "La Partita IVA del cedente deve essere di 11 cifre",
    });
  }

  for (let i = 0; i < input.linee.length; i++) {
    const linea = input.linee[i];

    if (linea.aliquotaIva !== 0) {
      errors.push({
        code: "INVALID_ALIQUOTA_IVA",
        field: `linee[${i}].aliquotaIva`,
        message: `Aliquota IVA deve essere 0% per Regime Forfettario (linea ${linea.numeroLinea})`,
      });
    }

    if (linea.natura !== "N2.2") {
      errors.push({
        code: "INVALID_NATURA_IVA",
        field: `linee[${i}].natura`,
        message: `Natura IVA deve essere N2.2 per Regime Forfettario (linea ${linea.numeroLinea})`,
      });
    }
  }

  const imponibile = input.linee.reduce((sum, l) => sum + l.prezzoTotale, 0);
  if (imponibile > SOGLIA_BOLLO && !input.datiGenerali.importoBollo) {
    errors.push({
      code: "MISSING_BOLLO",
      field: "datiGenerali.importoBollo",
      message: `Imposta di bollo obbligatoria per importi superiori a €${SOGLIA_BOLLO}`,
    });
  }

  const sdi = input.cessionario.codiceSdi;
  const pec = input.cessionario.pec;

  if (sdi && sdi !== "0000000" && sdi.length !== 7) {
    errors.push({
      code: "INVALID_CODICE_SDI",
      field: "cessionario.codiceSdi",
      message: "Il Codice SDI deve essere di 7 caratteri",
    });
  }

  if ((!sdi || sdi === "0000000") && !pec) {
    errors.push({
      code: "MISSING_DESTINATARIO",
      field: "cessionario.codiceSdi",
      message: "È necessario un Codice SDI o un indirizzo PEC per il destinatario",
    });
  }

  return errors;
}
