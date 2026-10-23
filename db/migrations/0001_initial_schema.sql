CREATE TYPE "public"."check_in_status" AS ENUM('here', 'leaving', 'heading_to_stadium', 'looking_for_fans', 'back_to_hotel');--> statement-breakpoint
CREATE TYPE "public"."competition_type" AS ENUM('club', 'international');--> statement-breakpoint
CREATE TYPE "public"."fixture_status" AS ENUM('scheduled', 'live', 'finished', 'postponed');--> statement-breakpoint
CREATE TYPE "public"."stay_visibility" AS ENUM('fans_only', 'public', 'private');--> statement-breakpoint
CREATE TYPE "public"."team_type" AS ENUM('club', 'national');--> statement-breakpoint
CREATE TYPE "public"."thread_category" AS ENUM('general', 'flights', 'hotels', 'pubs', 'transport', 'tickets', 'meetups');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('pub', 'restaurant', 'other');--> statement-breakpoint
CREATE TABLE "airports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"iata" char(3) NOT NULL,
	"city_id" uuid NOT NULL,
	"location" "geography" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fixture_id" uuid NOT NULL,
	"arrive_date" date,
	"depart_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"fixture_id" uuid NOT NULL,
	"status" "check_in_status" DEFAULT 'here' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country_code" char(2) NOT NULL,
	"currency" char(3) NOT NULL,
	"language" text NOT NULL,
	"timezone" text NOT NULL,
	"centre" "geography" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "competition_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fixtures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"stage" text,
	"home_team_id" uuid NOT NULL,
	"away_team_id" uuid NOT NULL,
	"stadium_id" uuid NOT NULL,
	"kickoff_utc" timestamp with time zone NOT NULL,
	"status" "fixture_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"score_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fixtures_different_teams" CHECK ("fixtures"."home_team_id" <> "fixtures"."away_team_id")
);
--> statement-breakpoint
CREATE TABLE "guide_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid,
	"fixture_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guide_sections_has_owner" CHECK ("guide_sections"."city_id" is not null or "guide_sections"."fixture_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"reported_count" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"fixture_id" uuid,
	"text" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stadiums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city_id" uuid NOT NULL,
	"capacity" integer,
	"location" "geography" NOT NULL,
	"away_entrance_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_id" uuid NOT NULL,
	"area" "geography" NOT NULL,
	"visibility" "stay_visibility" DEFAULT 'fans_only' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stays_attendance_id_unique" UNIQUE("attendance_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"type" "team_type" NOT NULL,
	"country_code" char(2) NOT NULL,
	"city_id" uuid,
	"home_stadium_id" uuid,
	"crest_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fixture_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "thread_category" DEFAULT 'general' NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_teams" (
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_teams_user_id_team_id_pk" PRIMARY KEY("user_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entra_id" text NOT NULL,
	"display_name" text NOT NULL,
	"home_airport_id" uuid,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_entra_id_unique" UNIQUE("entra_id")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "venue_type" NOT NULL,
	"city_id" uuid NOT NULL,
	"location" "geography" NOT NULL,
	"away_friendly" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "airports" ADD CONSTRAINT "airports_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_stadium_id_stadiums_id_fk" FOREIGN KEY ("stadium_id") REFERENCES "public"."stadiums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guide_sections" ADD CONSTRAINT "guide_sections_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guide_sections" ADD CONSTRAINT "guide_sections_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stadiums" ADD CONSTRAINT "stadiums_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stays" ADD CONSTRAINT "stays_attendance_id_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_home_stadium_id_stadiums_id_fk" FOREIGN KEY ("home_stadium_id") REFERENCES "public"."stadiums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_home_airport_id_airports_id_fk" FOREIGN KEY ("home_airport_id") REFERENCES "public"."airports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "airports_iata_uq" ON "airports" USING btree ("iata");--> statement-breakpoint
CREATE INDEX "airports_location_gix" ON "airports" USING gist ("location");--> statement-breakpoint
CREATE INDEX "airports_city_idx" ON "airports" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendances_user_fixture_uq" ON "attendances" USING btree ("user_id","fixture_id");--> statement-breakpoint
CREATE INDEX "attendances_fixture_idx" ON "attendances" USING btree ("fixture_id");--> statement-breakpoint
CREATE INDEX "check_ins_venue_active_idx" ON "check_ins" USING btree ("venue_id","expires_at");--> statement-breakpoint
CREATE INDEX "check_ins_fixture_active_idx" ON "check_ins" USING btree ("fixture_id","expires_at");--> statement-breakpoint
CREATE INDEX "cities_centre_gix" ON "cities" USING gist ("centre");--> statement-breakpoint
CREATE INDEX "fixtures_kickoff_idx" ON "fixtures" USING btree ("kickoff_utc");--> statement-breakpoint
CREATE INDEX "fixtures_home_team_idx" ON "fixtures" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "fixtures_away_team_idx" ON "fixtures" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "guide_sections_city_idx" ON "guide_sections" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "guide_sections_fixture_idx" ON "guide_sections" USING btree ("fixture_id");--> statement-breakpoint
CREATE INDEX "posts_thread_idx" ON "posts" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "recommendations_venue_idx" ON "recommendations" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "stadiums_location_gix" ON "stadiums" USING gist ("location");--> statement-breakpoint
CREATE INDEX "stadiums_city_idx" ON "stadiums" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "stays_area_gix" ON "stays" USING gist ("area");--> statement-breakpoint
CREATE INDEX "teams_city_idx" ON "teams" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "threads_fixture_category_idx" ON "threads" USING btree ("fixture_id","category");--> statement-breakpoint
CREATE INDEX "venues_location_gix" ON "venues" USING gist ("location");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city_id");