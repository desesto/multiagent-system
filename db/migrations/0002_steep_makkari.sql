CREATE TABLE "agentsvar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opgave_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"beslutningspunkt_id" uuid,
	"indhold" text NOT NULL,
	"resume" text NOT NULL,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agentsvar" ADD CONSTRAINT "agentsvar_opgave_id_opgaver_id_fk" FOREIGN KEY ("opgave_id") REFERENCES "public"."opgaver"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentsvar" ADD CONSTRAINT "agentsvar_agent_id_agenter_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agenter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentsvar" ADD CONSTRAINT "agentsvar_beslutningspunkt_id_beslutningspunkter_id_fk" FOREIGN KEY ("beslutningspunkt_id") REFERENCES "public"."beslutningspunkter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agentsvar_punkt" ON "agentsvar" USING btree ("beslutningspunkt_id");