import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CODICI_TRIBUTO_IMPOSTA } from "@fatturino/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, "../../../../docs/F24_editabile.pdf");

export type F24Deadline = "primo_acconto" | "secondo_acconto" | "saldo";

interface F24FillParams {
  codiceFiscale: string;
  ragioneSociale: string;
  anno: number;
  deadline: F24Deadline;
  amount: number;
}

const DEADLINE_CODICE: Record<F24Deadline, string> = {
  primo_acconto: CODICI_TRIBUTO_IMPOSTA.ACCONTO_PRIMO,
  secondo_acconto: CODICI_TRIBUTO_IMPOSTA.ACCONTO_SECONDO,
  saldo: CODICI_TRIBUTO_IMPOSTA.SALDO,
};

export async function generateF24Pdf(params: F24FillParams): Promise<Buffer> {
  const templateBytes = await readFile(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Fill codice fiscale (cf1–cf16, one char each)
  const cf = params.codiceFiscale.toUpperCase();
  for (let i = 0; i < Math.min(cf.length, 16); i++) {
    try {
      form.getTextField(`cf${i + 1}`).setText(cf[i]);
    } catch {}
  }

  // Fill ragione sociale
  try {
    form.getTextField("ragsociale").setText(params.ragioneSociale);
  } catch {}

  // Fill Sezione Erario row 1
  try {
    form.getTextField("codtrib1").setText(DEADLINE_CODICE[params.deadline]);
  } catch {}
  try {
    form.getTextField("annorif1").setText(String(params.anno));
  } catch {}

  const amountStr = params.amount.toFixed(2);
  try {
    form.getTextField("impvers1").setText(amountStr);
  } catch {}
  try {
    form.getTextField("tota").setText(amountStr);
  } catch {}
  try {
    form.getTextField("salab").setText(amountStr);
  } catch {}

  form.flatten();
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
