CREATE TYPE "public"."accountant_link_status" AS ENUM('pending', 'active', 'revoked');--> statement-breakpoint
CREATE TABLE "accountant_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entrepreneur_id" uuid NOT NULL,
	"accountant_user_id" text,
	"invited_email" text NOT NULL,
	"status" "accountant_link_status" DEFAULT 'pending' NOT NULL,
	"invite_token" text,
	"invite_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accountant_links_invite_token_unique" UNIQUE("invite_token"),
	CONSTRAINT "uq_accountant_link_invite" UNIQUE("entrepreneur_id","invited_email")
);
--> statement-breakpoint
ALTER TABLE "accountant_links" ADD CONSTRAINT "accountant_links_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountant_links" ADD CONSTRAINT "accountant_links_accountant_user_id_users_id_fk" FOREIGN KEY ("accountant_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accountant_links_accountant" ON "accountant_links" USING btree ("accountant_user_id","status");