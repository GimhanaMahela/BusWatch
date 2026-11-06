ALTER TYPE "public"."metric_event" ADD VALUE 'impact_view';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'scorecard_view';--> statement-breakpoint
CREATE TABLE "impact_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid,
	"category" "report_category",
	"route_number" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"translations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "hidden_from_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "impact_stories" ADD CONSTRAINT "impact_stories_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "impact_stories_published_published_at_index" ON "impact_stories" USING btree ("published","published_at" DESC NULLS LAST);