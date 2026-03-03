import { z } from "zod";
import {
  NATURA_IVA_FORFETTARIO,
  REGIME_FISCALE_FORFETTARIO,
} from "../constants/tax-rates.js";

// --- User ---

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// --- User Profile ---

export const createUserProfileSchema = z.object({
  ragioneSociale: z.string().min(1),
  partitaIva: z
    .string()
    .regex(/^\d{11}$/, "Partita IVA must be 11 digits"),
  codiceFiscale: z
    .string()
    .regex(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i, "Invalid codice fiscale format"),
  codiceAteco: z.string().min(1),
  regimeFiscale: z.string().default(REGIME_FISCALE_FORFETTARIO),
  indirizzo: z.string().min(1),
  cap: z.string().regex(/^\d{5}$/, "CAP must be 5 digits"),
  citta: z.string().min(1),
  provincia: z.string().length(2, "Provincia must be 2 characters"),
  pec: z.string().email().optional(),
  codiceSdi: z
    .string()
    .length(7, "Codice SDI must be 7 characters")
    .optional(),
  iban: z.string().optional(),
  annoInizioAttivita: z.number().int().min(1900).max(2100),
  gestioneInps: z.enum(["separata", "artigiani", "commercianti"]).default("separata"),
});

export const userProfileSchema = createUserProfileSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// --- Client ---

export const tipoClienteSchema = z.enum(["persona_fisica", "persona_giuridica"]);

export const createClientSchema = z.object({
  tipo: tipoClienteSchema,
  ragioneSociale: z.string().optional(),
  nome: z.string().optional(),
  cognome: z.string().optional(),
  partitaIva: z
    .string()
    .regex(/^\d{11}$/, "Partita IVA must be 11 digits")
    .optional(),
  codiceFiscale: z.string().min(1),
  codiceSdi: z.string().length(7).optional(),
  pec: z.string().email().optional(),
  email: z.string().email().optional(),
  indirizzo: z.string().min(1),
  cap: z.string().regex(/^\d{5}$/),
  citta: z.string().min(1),
  provincia: z.string().length(2),
  nazione: z.string().length(2).default("IT"),
});

export const clientSchema = createClientSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// --- Invoice Line ---

export const invoiceLineSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  descrizione: z.string().min(1),
  quantita: z.number().positive(),
  prezzoUnitario: z.number().nonnegative(),
  prezzoTotale: z.number().nonnegative(),
  aliquotaIva: z.number().default(0),
  naturaIva: z.string().default(NATURA_IVA_FORFETTARIO),
  createdAt: z.date(),
});

export const createInvoiceLineSchema = z.object({
  descrizione: z.string().min(1),
  quantita: z.number().positive(),
  prezzoUnitario: z.number().nonnegative(),
  aliquotaIva: z.number().default(0),
  naturaIva: z.string().default(NATURA_IVA_FORFETTARIO),
});

// --- Invoice ---

export const statoFatturaSchema = z.enum([
  "bozza",
  "inviata",
  "consegnata",
  "scartata",
  "accettata",
  "rifiutata",
  "mancata_consegna",
]);

export const tipoDocumentoSchema = z.enum([
  "TD01",
  "TD02",
  "TD03",
  "TD04",
  "TD05",
  "TD06",
  "TD24",
  "TD25",
]);

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  tipoDocumento: tipoDocumentoSchema.default("TD01"),
  causale: z.string().optional(),
  dataEmissione: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(createInvoiceLineSchema).min(1),
});

export const updateInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  tipoDocumento: tipoDocumentoSchema.default("TD01"),
  causale: z.string().optional(),
  dataEmissione: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(createInvoiceLineSchema).min(1),
});

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clientId: z.string().uuid(),
  numeroFattura: z.number().int().positive(),
  anno: z.number().int(),
  dataEmissione: z.date(),
  tipoDocumento: tipoDocumentoSchema,
  causale: z.string().nullable(),
  imponibile: z.number(),
  impostaBollo: z.number(),
  totaleDocumento: z.number(),
  stato: statoFatturaSchema,
  sdiIdentifier: z.string().nullable(),
  sdiStatus: z.string().nullable(),
  xmlContent: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
