CREATE TYPE "public"."auth_provider" AS ENUM('github', 'aad');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_provider" "auth_provider" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_user_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_uq" ON "users" USING btree ("auth_provider","auth_user_id");