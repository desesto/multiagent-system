CREATE TABLE "projekter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"navn" text NOT NULL,
	"beskrivelse" text DEFAULT '' NOT NULL,
	"sti" text,
	"slettet_tidspunkt" timestamp with time zone,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opgaver" ADD COLUMN "projekt_id" uuid;--> statement-breakpoint
ALTER TABLE "opgaver" ADD CONSTRAINT "opgaver_projekt_id_projekter_id_fk" FOREIGN KEY ("projekt_id") REFERENCES "public"."projekter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_opgaver_projekt" ON "opgaver" USING btree ("projekt_id");