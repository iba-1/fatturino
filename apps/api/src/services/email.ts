import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set. Configure it to enable invoice email sending.");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@fatturino.app";

interface SendInvoiceEmailParams {
  to: string;
  bcc?: string;
  invoiceNumber: string;
  invoiceYear: number;
  invoiceDate: string;
  invoiceTotal: string;
  clientName: string;
  senderName: string;
  pdfBuffer: Buffer;
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ id: string }> {
  const {
    to, bcc, invoiceNumber, invoiceYear, invoiceDate, invoiceTotal,
    clientName, senderName, pdfBuffer,
  } = params;

  const filename = `Fattura_${invoiceNumber}_${invoiceYear}.pdf`;
  const subject = `Fattura ${invoiceNumber}/${invoiceYear} — ${senderName}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Fattura ${invoiceNumber}/${invoiceYear}</h2>
      <p>Gentile ${clientName},</p>
      <p>In allegato trova la fattura n. <strong>${invoiceNumber}/${invoiceYear}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Data</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${invoiceDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Importo</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${invoiceTotal}</td>
        </tr>
      </table>
      <p>Cordiali saluti,<br/>${senderName}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #666;">
        Operazione effettuata ai sensi dell'articolo 1, commi da 54 a 89, della Legge n. 190/2014 — Regime Forfettario.
        Non soggetta a ritenuta d'acconto. Imposta di bollo assolta sull'originale per importi superiori a €77,47.
      </p>
    </div>
  `;

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: [to],
    bcc: bcc ? [bcc] : undefined,
    subject,
    html,
    attachments: [{ filename, content: pdfBuffer }],
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return { id: data!.id };
}
