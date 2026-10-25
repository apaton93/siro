CREATE TYPE "public"."fan_access" AS ENUM('normal', 'partial_closure', 'no_away_fans', 'behind_closed_doors');--> statement-breakpoint
ALTER TABLE "fixtures" ADD COLUMN "fan_access" "fan_access" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "fixtures" ADD COLUMN "fan_access_note" text;