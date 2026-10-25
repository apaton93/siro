CREATE TYPE "public"."venue_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "status" "venue_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "suggested_by" uuid;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_suggested_by_users_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venues_status_idx" ON "venues" USING btree ("status");--> statement-breakpoint
-- The development seed's clearly-labelled placeholder venues.
DELETE FROM "venues" WHERE "name" LIKE '[Placeholder]%';
