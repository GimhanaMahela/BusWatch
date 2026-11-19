ALTER TYPE "public"."metric_event" ADD VALUE 'ai_analysis';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'ai_blur';--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "ai_insights" jsonb;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "blurred_images" text[];