CREATE TYPE "public"."activity_type" AS ENUM('commercial', 'industrial', 'artisanal', 'service');--> statement-breakpoint
CREATE TYPE "public"."client_type" AS ENUM('individual', 'company_ma', 'company_foreign');--> statement-breakpoint
CREATE TYPE "public"."declaration_status" AS ENUM('pending', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('virement', 'cheque', 'espece', 'effet', 'carte', 'other');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entrepreneur_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "client_type" NOT NULL,
	"ice" text,
	"if_number" text,
	"email" text,
	"phone" text,
	"address" text,
	"country_code" text DEFAULT 'MA' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entrepreneurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"ice" text NOT NULL,
	"if_number" text NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"activity_description" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"phone" text,
	"bank_iban" text,
	"registration_date" date NOT NULL,
	"invoice_prefix" text DEFAULT 'FACT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entrepreneurs_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "entrepreneurs_ice_unique" UNIQUE("ice")
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_price_original" numeric(12, 2) NOT NULL,
	"line_total_original" numeric(12, 2) NOT NULL,
	"line_total_mad" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entrepreneur_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"sequence_number" integer NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"payment_method" "payment_method",
	"payment_date" date,
	"currency" text DEFAULT 'MAD' NOT NULL,
	"exchange_rate" numeric(10, 4),
	"subtotal_original" numeric(12, 2) NOT NULL,
	"subtotal_mad" numeric(12, 2) NOT NULL,
	"total_mad" numeric(12, 2) NOT NULL,
	"notes" text,
	"pdf_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_invoice_number" UNIQUE("entrepreneur_id","invoice_number"),
	CONSTRAINT "uq_invoice_sequence" UNIQUE("entrepreneur_id","fiscal_year","sequence_number")
);
--> statement-breakpoint
CREATE TABLE "quarterly_declarations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entrepreneur_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"quarter" integer NOT NULL,
	"total_turnover_mad" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(4, 3) NOT NULL,
	"tax_due_mad" numeric(12, 2) NOT NULL,
	"status" "declaration_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp,
	"pdf_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_declaration_quarter" UNIQUE("entrepreneur_id","year","quarter")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrepreneurs" ADD CONSTRAINT "entrepreneurs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarterly_declarations" ADD CONSTRAINT "quarterly_declarations_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invoices_client_year" ON "invoices" USING btree ("client_id","fiscal_year");--> statement-breakpoint
CREATE INDEX "idx_invoices_entrepreneur_year" ON "invoices" USING btree ("entrepreneur_id","fiscal_year");