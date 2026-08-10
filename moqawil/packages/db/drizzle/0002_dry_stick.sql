CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "quote_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_price_original" numeric(12, 2) NOT NULL,
	"line_total_original" numeric(12, 2) NOT NULL,
	"line_total_mad" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entrepreneur_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"quote_number" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"sequence_number" integer NOT NULL,
	"issue_date" date NOT NULL,
	"valid_until_date" date NOT NULL,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'MAD' NOT NULL,
	"exchange_rate" numeric(10, 4),
	"subtotal_original" numeric(12, 2) NOT NULL,
	"subtotal_mad" numeric(12, 2) NOT NULL,
	"total_mad" numeric(12, 2) NOT NULL,
	"notes" text,
	"pdf_path" text,
	"converted_to_invoice_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_quote_number" UNIQUE("entrepreneur_id","quote_number"),
	CONSTRAINT "uq_quote_sequence" UNIQUE("entrepreneur_id","fiscal_year","sequence_number")
);
--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_converted_to_invoice_id_invoices_id_fk" FOREIGN KEY ("converted_to_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_quotes_entrepreneur_year" ON "quotes" USING btree ("entrepreneur_id","fiscal_year");