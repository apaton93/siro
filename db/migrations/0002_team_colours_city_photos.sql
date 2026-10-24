ALTER TABLE "cities" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "photo_credit" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "primary_colour" char(7) DEFAULT '#0B0B0C' NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "on_primary_colour" char(7) DEFAULT '#FFFFFF' NOT NULL;