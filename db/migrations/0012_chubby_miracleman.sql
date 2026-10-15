CREATE TYPE "public"."autokoer_status" AS ENUM('venter', 'koerer', 'faerdig', 'fejlet');--> statement-breakpoint
CREATE TYPE "public"."autokoer_valgt_af" AS ENUM('bruger', 'arkitekt');--> statement-breakpoint
CREATE TABLE "autokoer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opgave_id" uuid NOT NULL,
	"status" "autokoer_status" DEFAULT 'venter' NOT NULL,
	"valgt_af" "autokoer_valgt_af",
	"valgt_af_agent_id" uuid,
	"begrundelse" text,
	"implementering_id" uuid,
	"pr_url" text,
	"besked" text,
	"tokenforbrug" jsonb,
	"tilfoejet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL,
	"startet_tidspunkt" timestamp with time zone,
	"afsluttet_tidspunkt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "implementeringer" ADD COLUMN "pr_url" text;--> statement-breakpoint
ALTER TABLE "autokoer" ADD CONSTRAINT "autokoer_opgave_id_opgaver_id_fk" FOREIGN KEY ("opgave_id") REFERENCES "public"."opgaver"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autokoer" ADD CONSTRAINT "autokoer_valgt_af_agent_id_agenter_id_fk" FOREIGN KEY ("valgt_af_agent_id") REFERENCES "public"."agenter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autokoer" ADD CONSTRAINT "autokoer_implementering_id_implementeringer_id_fk" FOREIGN KEY ("implementering_id") REFERENCES "public"."implementeringer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_autokoer_opgave" ON "autokoer" USING btree ("opgave_id");--> statement-breakpoint
CREATE INDEX "idx_autokoer_status" ON "autokoer" USING btree ("status");