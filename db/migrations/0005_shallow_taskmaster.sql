CREATE TYPE "public"."implementering_status" AS ENUM('koerer', 'klar', 'fejlet', 'kasseret', 'flettet');--> statement-breakpoint
CREATE TABLE "implementeringer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"opgave_id" uuid NOT NULL,
	"beslutningspunkt_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" "implementering_status" DEFAULT 'koerer' NOT NULL,
	"gren" text NOT NULL,
	"worktree_sti" text NOT NULL,
	"commit_hash" text,
	"aendrede_filer" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"laeste_filer" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"opsummering" text,
	"fejl" text,
	"tokenforbrug" jsonb,
	"pris_usd" double precision,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL,
	"afsluttet_tidspunkt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "agentsvar" ADD COLUMN "tokenforbrug" jsonb;--> statement-breakpoint
ALTER TABLE "implementeringer" ADD CONSTRAINT "implementeringer_opgave_id_opgaver_id_fk" FOREIGN KEY ("opgave_id") REFERENCES "public"."opgaver"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "implementeringer" ADD CONSTRAINT "implementeringer_beslutningspunkt_id_beslutningspunkter_id_fk" FOREIGN KEY ("beslutningspunkt_id") REFERENCES "public"."beslutningspunkter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "implementeringer" ADD CONSTRAINT "implementeringer_agent_id_agenter_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agenter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_implementeringer_opgave" ON "implementeringer" USING btree ("opgave_id");