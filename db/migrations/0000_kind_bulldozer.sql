CREATE TYPE "public"."opgave_status" AS ENUM('oprettet', 'nedbrudt', 'i_gang', 'afventer_beslutning', 'afsluttet');--> statement-breakpoint
CREATE TYPE "public"."opgave_type" AS ENUM('bugfix', 'ny_feature', 'system_fra_bunden', 'prototype');--> statement-breakpoint
CREATE TYPE "public"."rolle_status" AS ENUM('aktiv', 'drifting', 'deprecated', 'suspenderet');--> statement-breakpoint
CREATE TYPE "public"."sparrings_niveau" AS ENUM('normal', 'ekstra_arkitektur');--> statement-breakpoint
CREATE TABLE "agenter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rolle_id" uuid NOT NULL,
	"navn" text NOT NULL,
	"personlighed" text DEFAULT '' NOT NULL,
	"fokuspunkter" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sparrings_niveau" "sparrings_niveau" DEFAULT 'normal' NOT NULL,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brugere" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"navn" text NOT NULL,
	"email" text NOT NULL,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brugere_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "opgaver" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titel" text NOT NULL,
	"beskrivelse" text DEFAULT '' NOT NULL,
	"type" "opgave_type" NOT NULL,
	"status" "opgave_status" DEFAULT 'oprettet' NOT NULL,
	"fokuspunkter" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"oprettet_af_bruger_id" uuid NOT NULL,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roller" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"navn" text NOT NULL,
	"formaal" text NOT NULL,
	"scope_graenser" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"anbefalede_karakteristika" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"valgfrie_karakteristika" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"parent_rolle_id" uuid,
	"status" "rolle_status" DEFAULT 'aktiv' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agenter" ADD CONSTRAINT "agenter_rolle_id_roller_id_fk" FOREIGN KEY ("rolle_id") REFERENCES "public"."roller"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opgaver" ADD CONSTRAINT "opgaver_oprettet_af_bruger_id_brugere_id_fk" FOREIGN KEY ("oprettet_af_bruger_id") REFERENCES "public"."brugere"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roller" ADD CONSTRAINT "roller_parent_rolle_id_roller_id_fk" FOREIGN KEY ("parent_rolle_id") REFERENCES "public"."roller"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agenter_rolle" ON "agenter" USING btree ("rolle_id");--> statement-breakpoint
CREATE INDEX "idx_opgaver_status" ON "opgaver" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_opgaver_bruger" ON "opgaver" USING btree ("oprettet_af_bruger_id");--> statement-breakpoint
CREATE INDEX "idx_roller_status" ON "roller" USING btree ("status");