import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  unique,
  date,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const tipoClienteEnum = pgEnum("tipo_cliente", [
  "persona_fisica",
  "persona_giuridica",
]);

export const statoFatturaEnum = pgEnum("stato_fattura", [
  "bozza",
  "inviata",
  "consegnata",
  "scartata",
  "accettata",
  "rifiutata",
  "mancata_consegna",
]);

export const tipoDocumentoEnum = pgEnum("tipo_documento", [
  "TD01",
  "TD02",
  "TD03",
  "TD04",
  "TD05",
  "TD06",
  "TD24",
  "TD25",
]);

export const gestioneInpsEnum = pgEnum("gestione_inps", [
  "separata",
  "artigiani",
  "commercianti",
]);

export const tipoF24Enum = pgEnum("tipo_f24", [
  "acconto_primo",
  "acconto_secondo",
  "saldo",
]);

// --- Tables ---

// --- Better Auth tables ---
// Better Auth generates its own random string IDs (not UUIDs),
// so these tables use text primary keys instead of uuid.

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  idToken: text("id_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  ragioneSociale: varchar("ragione_sociale", { length: 255 }).notNull(),
  partitaIva: varchar("partita_iva", { length: 11 }).notNull(),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull(),
  codiceAteco: varchar("codice_ateco", { length: 10 }).notNull(),
  regimeFiscale: varchar("regime_fiscale", { length: 4 }).notNull().default("RF19"),
  indirizzo: text("indirizzo").notNull(),
  cap: varchar("cap", { length: 5 }).notNull(),
  citta: varchar("citta", { length: 255 }).notNull(),
  provincia: varchar("provincia", { length: 2 }).notNull(),
  pec: varchar("pec", { length: 255 }),
  codiceSdi: varchar("codice_sdi", { length: 7 }),
  iban: varchar("iban", { length: 34 }),
  annoInizioAttivita: integer("anno_inizio_attivita").notNull(),
  gestioneInps: gestioneInpsEnum("gestione_inps").notNull().default("separata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tipo: tipoClienteEnum("tipo").notNull(),
  ragioneSociale: varchar("ragione_sociale", { length: 255 }),
  nome: varchar("nome", { length: 255 }),
  cognome: varchar("cognome", { length: 255 }),
  partitaIva: varchar("partita_iva", { length: 11 }),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull(),
  codiceSdi: varchar("codice_sdi", { length: 7 }),
  pec: varchar("pec", { length: 255 }),
  email: varchar("email", { length: 255 }),
  indirizzo: text("indirizzo").notNull(),
  cap: varchar("cap", { length: 5 }).notNull(),
  citta: varchar("citta", { length: 255 }).notNull(),
  provincia: varchar("provincia", { length: 2 }).notNull(),
  nazione: varchar("nazione", { length: 2 }).notNull().default("IT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  numeroFattura: integer("numero_fattura").notNull(),
  anno: integer("anno").notNull(),
  dataEmissione: timestamp("data_emissione", { withTimezone: true }).notNull(),
  tipoDocumento: tipoDocumentoEnum("tipo_documento").notNull().default("TD01"),
  causale: text("causale"),
  imponibile: numeric("imponibile", { precision: 12, scale: 2 }).notNull(),
  impostaBollo: numeric("imposta_bollo", { precision: 4, scale: 2 }).notNull().default("0"),
  totaleDocumento: numeric("totale_documento", { precision: 12, scale: 2 }).notNull(),
  stato: statoFatturaEnum("stato").notNull().default("bozza"),
  sdiIdentifier: varchar("sdi_identifier", { length: 255 }),
  sdiStatus: text("sdi_status"),
  xmlContent: text("xml_content"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  descrizione: text("descrizione").notNull(),
  quantita: numeric("quantita", { precision: 10, scale: 4 }).notNull(),
  prezzoUnitario: numeric("prezzo_unitario", { precision: 12, scale: 2 }).notNull(),
  prezzoTotale: numeric("prezzo_totale", { precision: 12, scale: 2 }).notNull(),
  aliquotaIva: numeric("aliquota_iva", { precision: 5, scale: 2 }).notNull().default("0"),
  naturaIva: varchar("natura_iva", { length: 10 }).default("N2.2"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taxPeriods = pgTable("tax_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  anno: integer("anno").notNull(),
  totaleFatturato: numeric("totale_fatturato", { precision: 12, scale: 2 }).notNull(),
  coefficienteRedditivita: numeric("coefficiente_redditivita", { precision: 5, scale: 2 }).notNull(),
  redditoLordo: numeric("reddito_lordo", { precision: 12, scale: 2 }).notNull(),
  contributiInpsVersati: numeric("contributi_inps_versati", { precision: 12, scale: 2 }).notNull(),
  redditoImponibile: numeric("reddito_imponibile", { precision: 12, scale: 2 }).notNull(),
  aliquotaImposta: numeric("aliquota_imposta", { precision: 5, scale: 2 }).notNull(),
  impostaDovuta: numeric("imposta_dovuta", { precision: 12, scale: 2 }).notNull(),
  accontiVersati: numeric("acconti_versati", { precision: 12, scale: 2 }).notNull().default("0"),
  saldo: numeric("saldo", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inpsContributions = pgTable("inps_contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  anno: integer("anno").notNull(),
  gestione: gestioneInpsEnum("gestione").notNull(),
  baseImponibile: numeric("base_imponibile", { precision: 12, scale: 2 }).notNull(),
  aliquota: numeric("aliquota", { precision: 5, scale: 2 }).notNull(),
  contributoFisso: numeric("contributo_fisso", { precision: 12, scale: 2 }).notNull().default("0"),
  contributoEccedenza: numeric("contributo_eccedenza", { precision: 12, scale: 2 }).notNull().default("0"),
  totaleDovuto: numeric("totale_dovuto", { precision: 12, scale: 2 }).notNull(),
  accontiVersati: numeric("acconti_versati", { precision: 12, scale: 2 }).notNull().default("0"),
  saldo: numeric("saldo", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const f24Forms = pgTable("f24_forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  anno: integer("anno").notNull(),
  periodo: varchar("periodo", { length: 20 }).notNull(),
  tipo: tipoF24Enum("tipo").notNull(),
  sezioneErario: jsonb("sezione_erario").notNull(),
  sezioneInps: jsonb("sezione_inps").notNull(),
  totale: numeric("totale", { precision: 12, scale: 2 }).notNull(),
  generatedPdfPath: text("generated_pdf_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deadlineTypeEnum = pgEnum("deadline_type", [
  "primo_acconto",
  "secondo_acconto",
  "saldo",
]);

export const taxPayments = pgTable("tax_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  anno: integer("anno").notNull(),
  deadline: deadlineTypeEnum("deadline").notNull(),
  amountDue: numeric("amount_due", { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }),
  datePaid: date("date_paid"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.userId, table.anno, table.deadline),
]);
