ALTER TABLE "competitions" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_code_unique" UNIQUE("code");--> statement-breakpoint
UPDATE "competitions" SET "code" = 'UCL' WHERE "name" = 'UEFA Champions League';--> statement-breakpoint
UPDATE "competitions" SET "code" = 'UEL' WHERE "name" = 'UEFA Europa League';--> statement-breakpoint
UPDATE "competitions" SET "code" = 'UECL' WHERE "name" = 'UEFA Conference League';
