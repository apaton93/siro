CREATE TABLE "post_reports" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_reports_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Existing duplicate names (ignoring case): keep the earliest, number the rest ("Andy 2", "Andy 3").
UPDATE "users" u SET "display_name" = left(d."display_name", 27) || ' ' || d.rn
FROM (
	SELECT "id", "display_name", row_number() OVER (PARTITION BY lower("display_name") ORDER BY "created_at", "id") AS rn
	FROM "users"
) d
WHERE u."id" = d."id" AND d.rn > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "users_display_name_uq" ON "users" USING btree (lower("display_name"));