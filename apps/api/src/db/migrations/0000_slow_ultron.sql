CREATE TYPE "public"."gestione_inps" AS ENUM('separata', 'artigiani', 'commercianti');--> statement-breakpoint
CREATE TYPE "public"."stato_fattura" AS ENUM('bozza', 'inviata', 'consegnata', 'scartata', 'accettata', 'rifiutata', 'mancata_consegna');--> statement-breakpoint
CREATE TYPE "public"."tipo_cliente" AS ENUM('persona_fisica', 'persona_giuridica');--> statement-breakpoint
CREATE TYPE "public"."tipo_documento" AS ENUM('TD01', 'TD02', 'TD03', 'TD04', 'TD05', 'TD06', 'TD24', 'TD25');--> statement-breakpoint
CREATE TYPE "public"."tipo_f24" AS ENUM('acconto_primo', 'acconto_secondo', 'saldo');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"id_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tipo" "tipo_cliente" NOT NULL,
	"ragione_sociale" varchar(255),
	"nome" varchar(255),
	"cognome" varchar(255),
	"partita_iva" varchar(11),
	"codice_fiscale" varchar(16) NOT NULL,
	"codice_sdi" varchar(7),
	"pec" varchar(255),
	"email" varchar(255),
	"indirizzo" text NOT NULL,
	"cap" varchar(5) NOT NULL,
	"citta" varchar(255) NOT NULL,
	"provincia" varchar(2) NOT NULL,
	"nazione" varchar(2) DEFAULT 'IT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "f24_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"anno" integer NOT NULL,
	"periodo" varchar(20) NOT NULL,
	"tipo" "tipo_f24" NOT NULL,
	"sezione_erario" jsonb NOT NULL,
	"sezione_inps" jsonb NOT NULL,
	"totale" numeric(12, 2) NOT NULL,
	"generated_pdf_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inps_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"anno" integer NOT NULL,
	"gestione" "gestione_inps" NOT NULL,
	"base_imponibile" numeric(12, 2) NOT NULL,
	"aliquota" numeric(5, 2) NOT NULL,
	"contributo_fisso" numeric(12, 2) DEFAULT '0' NOT NULL,
	"contributo_eccedenza" numeric(12, 2) DEFAULT '0' NOT NULL,
	"totale_dovuto" numeric(12, 2) NOT NULL,
	"acconti_versati" numeric(12, 2) DEFAULT '0' NOT NULL,
	"saldo" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"descrizione" text NOT NULL,
	"quantita" numeric(10, 4) NOT NULL,
	"prezzo_unitario" numeric(12, 2) NOT NULL,
	"prezzo_totale" numeric(12, 2) NOT NULL,
	"aliquota_iva" numeric(5, 2) DEFAULT '0' NOT NULL,
	"natura_iva" varchar(10) DEFAULT 'N2.2',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"client_id" uuid NOT NULL,
	"numero_fattura" integer NOT NULL,
	"anno" integer NOT NULL,
	"data_emissione" timestamp with time zone NOT NULL,
	"tipo_documento" "tipo_documento" DEFAULT 'TD01' NOT NULL,
	"causale" text,
	"imponibile" numeric(12, 2) NOT NULL,
	"imposta_bollo" numeric(4, 2) DEFAULT '0' NOT NULL,
	"totale_documento" numeric(12, 2) NOT NULL,
	"stato" "stato_fattura" DEFAULT 'bozza' NOT NULL,
	"sdi_identifier" varchar(255),
	"sdi_status" text,
	"xml_content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tax_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"anno" integer NOT NULL,
	"totale_fatturato" numeric(12, 2) NOT NULL,
	"coefficiente_redditivita" numeric(5, 2) NOT NULL,
	"reddito_lordo" numeric(12, 2) NOT NULL,
	"contributi_inps_versati" numeric(12, 2) NOT NULL,
	"reddito_imponibile" numeric(12, 2) NOT NULL,
	"aliquota_imposta" numeric(5, 2) NOT NULL,
	"imposta_dovuta" numeric(12, 2) NOT NULL,
	"acconti_versati" numeric(12, 2) DEFAULT '0' NOT NULL,
	"saldo" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"ragione_sociale" varchar(255) NOT NULL,
	"partita_iva" varchar(11) NOT NULL,
	"codice_fiscale" varchar(16) NOT NULL,
	"codice_ateco" varchar(10) NOT NULL,
	"regime_fiscale" varchar(4) DEFAULT 'RF19' NOT NULL,
	"indirizzo" text NOT NULL,
	"cap" varchar(5) NOT NULL,
	"citta" varchar(255) NOT NULL,
	"provincia" varchar(2) NOT NULL,
	"pec" varchar(255),
	"codice_sdi" varchar(7),
	"iban" varchar(34),
	"anno_inizio_attivita" integer NOT NULL,
	"gestione_inps" "gestione_inps" DEFAULT 'separata' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "f24_forms" ADD CONSTRAINT "f24_forms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inps_contributions" ADD CONSTRAINT "inps_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_periods" ADD CONSTRAINT "tax_periods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;