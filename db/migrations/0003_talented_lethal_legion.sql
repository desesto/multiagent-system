ALTER TABLE "beslutningspunkter" ADD COLUMN "tidligere_valg" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "opgaver" ADD COLUMN "slettet_tidspunkt" timestamp with time zone;