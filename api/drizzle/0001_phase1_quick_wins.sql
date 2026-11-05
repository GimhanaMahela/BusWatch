CREATE TYPE "public"."language" AS ENUM('en', 'si', 'ta');--> statement-breakpoint
CREATE TYPE "public"."metric_event" AS ENUM('report_form_started', 'report_submitted', 'commendation_form_started', 'commendation_submitted', 'qr_scan', 'tracking_view', 'tracking_return_view', 'report_shared', 'offline_report_queued', 'app_installed');--> statement-breakpoint
CREATE TYPE "public"."report_source" AS ENUM('web', 'qr');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('complaint', 'commendation');--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'safe_driving';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'helpful_staff';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'clean_vehicle';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'on_time';--> statement-breakpoint
ALTER TYPE "public"."report_category" ADD VALUE 'fair_fare';--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"day" date NOT NULL,
	"event" "metric_event" NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_metrics_day_event_pk" PRIMARY KEY("day","event")
);
--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "location" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "type" "report_type" DEFAULT 'complaint' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "language" "language" DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "source" "report_source" DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "outcome_rating" smallint;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "outcome_feedback" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "rated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "reports_type_index" ON "reports" USING btree ("type");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "outcome_rating_range" CHECK ("reports"."outcome_rating" BETWEEN 1 AND 5);