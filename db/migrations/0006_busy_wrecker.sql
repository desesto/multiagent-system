CREATE TABLE "kommentarer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beslutningspunkt_id" uuid NOT NULL,
	"tekst" text NOT NULL,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beslutningspunkter" ADD COLUMN "erstattet_af" uuid;--> statement-breakpoint
ALTER TABLE "kommentarer" ADD CONSTRAINT "kommentarer_beslutningspunkt_id_beslutningspunkter_id_fk" FOREIGN KEY ("beslutningspunkt_id") REFERENCES "public"."beslutningspunkter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_kommentarer_punkt" ON "kommentarer" USING btree ("beslutningspunkt_id");--> statement-breakpoint
ALTER TABLE "beslutningspunkter" ADD CONSTRAINT "beslutningspunkter_erstattet_af_beslutningspunkter_id_fk" FOREIGN KEY ("erstattet_af") REFERENCES "public"."beslutningspunkter"("id") ON DELETE no action ON UPDATE no action;