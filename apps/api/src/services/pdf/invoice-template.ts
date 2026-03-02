export interface InvoiceTemplateData {
  cedente: {
    ragioneSociale: string;
    partitaIva: string;
    codiceFiscale: string;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
  };
  cliente: {
    denominazione: string;
    partitaIva?: string;
    codiceFiscale: string;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
  };
  fattura: {
    numero: string;
    data: string;
    causale?: string;
  };
  linee: Array<{
    descrizione: string;
    quantita: string;
    prezzoUnitario: string;
    prezzoTotale: string;
  }>;
  imponibile: string;
  bollo?: string;
  totale: string;
  disclaimer: string;
}

export function renderInvoiceHtml(data: InvoiceTemplateData): string {
  const bolloRow = data.bollo
    ? `<tr><td colspan="3" class="text-right">Imposta di bollo</td><td class="text-right">${data.bollo}</td></tr>`
    : "";

  const lineRows = data.linee
    .map(
      (l) => `
      <tr>
        <td>${l.descrizione}</td>
        <td class="text-right">${l.quantita}</td>
        <td class="text-right">${l.prezzoUnitario}</td>
        <td class="text-right">${l.prezzoTotale}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; color: #1a1a1a; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .cedente, .cliente { width: 45%; }
    .label { font-size: 9pt; color: #666; text-transform: uppercase; margin-bottom: 4px; }
    .name { font-size: 14pt; font-weight: bold; margin-bottom: 4px; }
    .detail { font-size: 10pt; color: #333; line-height: 1.4; }
    .invoice-meta { margin-bottom: 30px; padding: 12px 16px; background: #f5f5f5; border-radius: 4px; }
    .invoice-meta h2 { font-size: 16pt; margin-bottom: 4px; }
    .invoice-meta .date { font-size: 10pt; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #333; font-size: 9pt; text-transform: uppercase; color: #666; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .totals td { border-bottom: none; font-size: 10pt; }
    .totals .total-row td { font-weight: bold; font-size: 12pt; border-top: 2px solid #333; }
    .disclaimer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 8pt; color: #666; font-style: italic; line-height: 1.4; }
    .causale { margin-bottom: 20px; font-size: 10pt; color: #333; }
  </style>
</head>
<body>
  <div class="header">
    <div class="cedente">
      <div class="label">Cedente / Prestatore</div>
      <div class="name">${data.cedente.ragioneSociale}</div>
      <div class="detail">
        P.IVA: ${data.cedente.partitaIva}<br>
        C.F.: ${data.cedente.codiceFiscale}<br>
        ${data.cedente.indirizzo}<br>
        ${data.cedente.cap} ${data.cedente.citta} (${data.cedente.provincia})
      </div>
    </div>
    <div class="cliente">
      <div class="label">Cessionario / Committente</div>
      <div class="name">${data.cliente.denominazione}</div>
      <div class="detail">
        ${data.cliente.partitaIva ? `P.IVA: ${data.cliente.partitaIva}<br>` : ""}C.F.: ${data.cliente.codiceFiscale}<br>
        ${data.cliente.indirizzo}<br>
        ${data.cliente.cap} ${data.cliente.citta} (${data.cliente.provincia})
      </div>
    </div>
  </div>

  <div class="invoice-meta">
    <h2>Fattura ${data.fattura.numero}</h2>
    <div class="date">Data: ${data.fattura.data}</div>
  </div>

  ${data.fattura.causale ? `<div class="causale"><strong>Causale:</strong> ${data.fattura.causale}</div>` : ""}

  <table>
    <thead>
      <tr>
        <th>Descrizione</th>
        <th class="text-right">Quantità</th>
        <th class="text-right">Prezzo unitario</th>
        <th class="text-right">Totale</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
    </tbody>
  </table>

  <table class="totals">
    <tbody>
      <tr><td colspan="3" class="text-right">Imponibile</td><td class="text-right">${data.imponibile}</td></tr>
      ${bolloRow}
      <tr class="total-row"><td colspan="3" class="text-right">Totale documento</td><td class="text-right">${data.totale}</td></tr>
    </tbody>
  </table>

  <div class="disclaimer">${data.disclaimer}</div>
</body>
</html>`;
}
