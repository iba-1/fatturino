import { XMLParser } from "fast-xml-parser";
import type { ValidationError } from "./business-rules.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: false,
});

export function validateXml(xml: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Parse XML
  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xml);
  } catch (e) {
    return [{
      code: "XML_PARSE_ERROR",
      field: "xml",
      message: e instanceof Error ? e.message : "Failed to parse XML",
    }];
  }

  // 2. Find root element (may be namespaced)
  const rootKey = Object.keys(parsed).find(k => k.includes("FatturaElettronica"));
  if (!rootKey) {
    errors.push({
      code: "MISSING_ROOT_ELEMENT",
      field: "FatturaElettronica",
      message: "Missing root element p:FatturaElettronica",
    });
    return errors;
  }

  const root = parsed[rootKey] as Record<string, unknown>;

  // 3. Check header
  if (!root.FatturaElettronicaHeader) {
    errors.push({
      code: "MISSING_HEADER",
      field: "FatturaElettronicaHeader",
      message: "Missing FatturaElettronicaHeader element",
    });
  }

  // 4. Check body
  if (!root.FatturaElettronicaBody) {
    errors.push({
      code: "MISSING_BODY",
      field: "FatturaElettronicaBody",
      message: "Missing FatturaElettronicaBody element",
    });
  }

  return errors;
}
