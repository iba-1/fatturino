import { XMLBuilder } from "fast-xml-parser";
import { buildHeader } from "./sections/header.js";
import { buildBody } from "./sections/body.js";
import type { FatturaInput } from "./types.js";

const FATTURAPA_NAMESPACE = "http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2";

export function buildFatturaXml(input: FatturaInput): string {
  const header = buildHeader(input.cedente, input.cessionario);
  const body = buildBody(input.datiGenerali, input.linee);

  const doc = {
    "p:FatturaElettronica": {
      "@_xmlns:p": FATTURAPA_NAMESPACE,
      "@_versione": "FPR12",
      FatturaElettronicaHeader: header,
      FatturaElettronicaBody: body,
    },
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    suppressEmptyNode: true,
  });

  const xmlBody = builder.build(doc);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`;
}
