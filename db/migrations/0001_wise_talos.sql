CREATE TABLE "beslutningspunkter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opgave_id" uuid NOT NULL,
	"stillet_af" text NOT NULL,
	"spoergsmaal" text NOT NULL,
	"valgmuligheder" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"valgt_mulighed_id" text,
	"besluttet_tidspunkt" timestamp with time zone,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beslutningspunkter" ADD CONSTRAINT "beslutningspunkter_opgave_id_opgaver_id_fk" FOREIGN KEY ("opgave_id") REFERENCES "public"."opgaver"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_beslutningspunkter_opgave" ON "beslutningspunkter" USING btree ("opgave_id");