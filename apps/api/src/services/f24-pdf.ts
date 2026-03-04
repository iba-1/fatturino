import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CODICI_TRIBUTO_IMPOSTA } from "@fatturino/shared";
import type { F24SezioneInpsRiga } from "@fatturino/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, "../../../../docs/F24_editabile.pdf");

export type F24Deadline = "primo_acconto" | "secondo_acconto" | "saldo";

interface F24FillParams {
  codiceFiscale: string;
  ragioneSociale: string;
  anno: number;
  deadline: F24Deadline;
  /** Imposta sostitutiva amount for this deadline */
  amount: number;
  /** Optional INPS rows to fill in Sezione INPS */
  inpsRows?: F24SezioneInpsRiga[];
}

const DEADLINE_CODICE: Record<F24Deadline, string> = {
  primo_acconto: CODICI_TRIBUTO_IMPOSTA.ACCONTO_PRIMO,
  secondo_acconto: CODICI_TRIBUTO_IMPOSTA.ACCONTO_SECONDO,
  saldo: CODICI_TRIBUTO_IMPOSTA.SALDO,
};

function setField(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string): void {
  try {
    form.getTextField(name).setText(value);
  } catch {
    // Field may not exist in template — silently skip
  }
}

export async function generateF24Pdf(params: F24FillParams): Promise<Buffer> {
  const templateBytes = await readFile(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Fill codice fiscale (cf1–cf16, one char each)
  const cf = params.codiceFiscale.toUpperCase();
  for (let i = 0; i < Math.min(cf.length, 16); i++) {
    setField(form, `cf${i + 1}`, cf[i]);
  }

  // Fill ragione sociale
  setField(form, "ragsociale", params.ragioneSociale);

  // --- Sezione Erario (row 1) ---
  setField(form, "codtrib1", DEADLINE_CODICE[params.deadline]);
  setField(form, "annorif1", String(params.anno));

  const amountStr = params.amount.toFixed(2);
  setField(form, "impvers1", amountStr);

  // Erario totals
  setField(form, "tota", amountStr);
  setField(form, "salab", amountStr);

  // --- Sezione INPS ---
  const inpsRows = params.inpsRows ?? [];
  let inpsTotalDebito = 0;

  for (let i = 0; i < Math.min(inpsRows.length, 4); i++) {
    const row = inpsRows[i];
    const n = i + 1; // field suffix: 1-4

    setField(form, `codsed${n}`, row.codiceSede);
    setField(form, `cauctr${n}`, row.causaleContributo);
    setField(form, `matrinps${n}`, row.matricola);

    // Periodo da: mm/yyyy split into month and year fields
    const [daMM, daYYYY] = row.periodoRiferimentoDa.split("/");
    setField(form, `prifdamm${n}`, daMM);
    setField(form, `prifdaa${n}`, daYYYY);

    // Periodo a: mm/yyyy
    const [aMM, aYYYY] = row.periodoRiferimentoA.split("/");
    setField(form, `prifamm${n}`, aMM);
    setField(form, `prifaaa${n}`, aYYYY);

    const debitoStr = row.importoADebito.toFixed(2);
    setField(form, `impdinps${n}`, debitoStr);

    if (row.importoACredito > 0) {
      setField(form, `impcinps${n}`, row.importoACredito.toFixed(2));
    }

    inpsTotalDebito += row.importoADebito;
  }

  // INPS totals
  if (inpsTotalDebito > 0) {
    const inpsTotalStr = inpsTotalDebito.toFixed(2);
    setField(form, "toti", inpsTotalStr);
    setField(form, "salil", inpsTotalStr);
  }

  // Grand total (Erario + INPS)
  const grandTotal = params.amount + inpsTotalDebito;
  if (grandTotal > 0) {
    setField(form, "salab", grandTotal.toFixed(2));
  }

  form.flatten();
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
