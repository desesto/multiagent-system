CREATE TABLE "vedhaeftninger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opgave_id" uuid,
	"kommentar_id" uuid,
	"navn" text NOT NULL,
	"type" text NOT NULL,
	"stoerrelse" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"oprettet_tidspunkt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vedhaeftninger" ADD CONSTRAINT "vedhaeftninger_opgave_id_opgaver_id_fk" FOREIGN KEY ("opgave_id") REFERENCES "public"."opgaver"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vedhaeftninger" ADD CONSTRAINT "vedhaeftninger_kommentar_id_kommentarer_id_fk" FOREIGN KEY ("kommentar_id") REFERENCES "public"."kommentarer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_vedhaeftninger_opgave" ON "vedhaeftninger" USING btree ("opgave_id");--> statement-breakpoint
CREATE INDEX "idx_vedhaeftninger_kommentar" ON "vedhaeftninger" USING btree ("kommentar_id");