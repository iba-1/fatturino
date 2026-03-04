CREATE TYPE "public"."deadline_type" AS ENUM('primo_acconto', 'secondo_acconto', 'saldo');--> statement-breakpoint
ALTER TYPE "public"."stato_fattura" ADD VALUE 'stornata';--> statement-breakpoint
CREATE TABLE "tax_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"anno" integer NOT NULL,
	"deadline" "deadline_type" NOT NULL,
	"amount_due" numeric(12, 2) NOT NULL,
	"amount_paid" numeric(12, 2),
	"date_paid" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_payments_user_id_anno_deadline_unique" UNIQUE("user_id","anno","deadline")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "pagata" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "data_pagamento" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "original_invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "credit_note_id" uuid;--> statement-breakpoint
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_original_invoice_id_invoices_id_fk" FOREIGN KEY ("original_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_credit_note_id_invoices_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;