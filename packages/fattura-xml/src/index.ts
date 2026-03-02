export { buildFatturaXml } from "./builder.js";
export { validateBusinessRules } from "./validation/business-rules.js";
export { validateXml } from "./validation/xml-validator.js";
export type { ValidationError } from "./validation/business-rules.js";
export type {
  FatturaInput,
  CedenteData,
  CessionarioData,
  DatiGeneraliData,
  DettaglioLineaData,
} from "./types.js";
