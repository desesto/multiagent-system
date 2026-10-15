ALTER TABLE "agentsvar" ADD COLUMN "laeste_filer" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "opgaver" ADD COLUMN "projekt_sti" text;