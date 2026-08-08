CREATE TYPE "public"."clearance_status" AS ENUM('not_applicable', 'ready', 'submitted', 'cleared', 'rejected');--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "clearance_status" "clearance_status" DEFAULT 'not_applicable' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "ubl_xml_path" text;