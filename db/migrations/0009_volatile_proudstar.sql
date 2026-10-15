CREATE TYPE "public"."opgave_omraade" AS ENUM('frontend', 'backend', 'fuldstack', 'andet');--> statement-breakpoint
ALTER TABLE "opgaver" ADD COLUMN "omraade" "opgave_omraade";