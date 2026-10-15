CREATE TYPE "public"."billed_status" AS ENUM('tages', 'klar', 'fejlet');--> statement-breakpoint
CREATE TYPE "public"."skaermbillede_tilstand" AS ENUM('foer', 'efter');--> statement-breakpoint
CREATE TABLE "skaermbilleder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"implementering_id" uuid NOT NULL,
	"rute" text NOT NULL,
	"tilstand" "skaermbillede_tilstand" NOT NULL,
	"bredde" integer NOT NULL,
	"hoejde" integer NOT NULL,
	"png" "bytea" NOT NULL,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "implementeringer" ADD COLUMN "billed_status" "billed_status";--> statement-breakpoint
ALTER TABLE "implementeringer" ADD COLUMN "billed_besked" text;--> statement-breakpoint
ALTER TABLE "skaermbilleder" ADD CONSTRAINT "skaermbilleder_implementering_id_implementeringer_id_fk" FOREIGN KEY ("implementering_id") REFERENCES "public"."implementeringer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_skaermbilleder_implementering" ON "skaermbilleder" USING btree ("implementering_id");