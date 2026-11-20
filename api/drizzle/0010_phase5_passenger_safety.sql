CREATE TYPE "public"."service_class" AS ENUM('normal', 'semi_luxury', 'luxury');--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'lost_item_submitted';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'fare_checked';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'safety_report_submitted';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'trip_share_started';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'emergency_shown';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'accessibility' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'bag';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'phone';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'wallet';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'documents';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'keys';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'clothing';--> statement-breakpoint
ALTER TYPE "public"."report_type" ADD VALUE 'lost_item';--> statement-breakpoint
CREATE TABLE "fare_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_key" text NOT NULL,
	"route_number" text NOT NULL,
	"name" text NOT NULL,
	"service_classes" "service_class"[] DEFAULT '{"normal"}' NOT NULL,
	"stops" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fare_routes_routeKey_unique" UNIQUE("route_key")
);
--> statement-breakpoint
CREATE TABLE "fare_tables" (
	"service_class" "service_class" PRIMARY KEY NOT NULL,
	"fares" integer[] NOT NULL,
	"effective_from" date,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_token_hash" text NOT NULL,
	"bus_number" text,
	"route_number" text,
	"latitude" double precision,
	"longitude" double precision,
	"accuracy" double precision,
	"position_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "details" jsonb;--> statement-breakpoint
CREATE INDEX "trip_shares_started_at_index" ON "trip_shares" USING btree ("started_at");