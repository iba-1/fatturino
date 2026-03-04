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

/**
 * Rateazione field value per deadline.
 * 1790 (primo acconto) and 1792 (saldo) support rateizzazione — default 0101 (single payment).
 * 1791 (secondo acconto) must be paid in unica soluzione — no rateazione.
 */
const DEADLINE_RATEAZIONE: Record<F24Deadline, string | null> = {
  primo_acconto: "0101",
  secondo_acconto: null, // 1791 cannot be rateizzato
  saldo: "0101",
};

function setField(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string): void {
  try {
    form.getTextField(name).setText(value);
  } catch {
    // Field may not exist in template — silently skip
  }
}

/**
 * F24 PDF field name mapping (verified via pdf-lib field dump of F24_editabile.pdf):
 *
 * Header:
 *   cf1-cf16          — codice fiscale (one char each)
 *   ragsociale        — ragione sociale / cognome e nome
 *   annoimposta       — anno di imposta
 *
 * Sezione Erario (rows 1-6):
 *   codtrib{1-6}      — codice tributo
 *   ratregpro{1-6}    — rateazione/regione/provincia/mese riferimento
 *   annorif{1-6}      — anno di riferimento
 *   impvers{1-6}      — importi a debito versati
 *   impcom{1-6}       — importi a credito compensati
 *   tota              — totale A (sum debiti)
 *   totb              — totale B (sum crediti)
 *   salab             — saldo (A - B)
 *
 * Sezione INPS (rows 1-4):
 *   codsed{1-4}       — codice sede
 *   cauctr{1-4}       — causale contributo
 *   matrinps{1-4}     — matricola INPS
 *   prifdamm{N}/prifdaa{N}  — periodo da (month/year)
 *   prifamm{N}/prifaaa{N}   — periodo a (month/year)
 *   impvers{10-13}    — importi a debito versati
 *   impcom{10-13}     — importi a credito compensati
 *   totc              — totale C (sum debiti INPS)
 *   totd              — totale D (sum crediti INPS)
 *   salcd             — saldo (C - D)
 *
 * Footer:
 *   salfin            — saldo finale (sum of all section saldi)
 */
export async function generateF24Pdf(params: F24FillParams): Promise<Buffer> {
  const templateBytes = await readFile(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // --- Header ---
  const cf = params.codiceFiscale.toUpperCase();
  for (let i = 0; i < Math.min(cf.length, 16); i++) {
    setField(form, `cf${i + 1}`, cf[i]);
  }
  setField(form, "ragsociale", params.ragioneSociale);
  setField(form, "annoimposta", String(params.anno));

  // --- Sezione Erario (row 1) ---
  setField(form, "codtrib1", DEADLINE_CODICE[params.deadline]);
  const rateazione = DEADLINE_RATEAZIONE[params.deadline];
  if (rateazione) {
    setField(form, "ratregpro1", rateazione);
  }
  setField(form, "annorif1", String(params.anno));

  const amountStr = params.amount.toFixed(2);
  setField(form, "impvers1", amountStr);

  // Erario totals
  setField(form, "tota", amountStr);
  setField(form, "salab", amountStr);

  // --- Sezione INPS ---
  const inpsRows = params.inpsRows ?? [];
  let inpsTotalDebito = 0;

  // INPS importi use field indices 10-13 (mapping: row 0→10, row 1→11, etc.)
  for (let i = 0; i < Math.min(inpsRows.length, 4); i++) {
    const row = inpsRows[i];
    const n = i + 1; // codsed/cauctr/matrinps/periodo use suffix 1-4
    const impIdx = i + 10; // importi use suffix 10-13

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

    // Importi a debito/credito
    const debitoStr = row.importoADebito.toFixed(2);
    setField(form, `impvers${impIdx}`, debitoStr);

    if (row.importoACredito > 0) {
      setField(form, `impcom${impIdx}`, row.importoACredito.toFixed(2));
    }

    inpsTotalDebito += row.importoADebito;
  }

  // INPS totals (totc/totd/salcd — NOT toti/salil which are "altri enti")
  if (inpsTotalDebito > 0) {
    const inpsTotalStr = inpsTotalDebito.toFixed(2);
    setField(form, "totc", inpsTotalStr);
    setField(form, "salcd", inpsTotalStr);
  }

  // Grand total (saldo finale = sum of all section saldi)
  const grandTotal = params.amount + inpsTotalDebito;
  if (grandTotal > 0) {
    setField(form, "salfin", grandTotal.toFixed(2));
  }

  form.flatten();
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
