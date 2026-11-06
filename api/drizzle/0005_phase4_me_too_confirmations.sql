ALTER TYPE "public"."metric_event" ADD VALUE 'confirmation_offered';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'report_confirmed';--> statement-breakpoint
CREATE TABLE "report_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"comment" text,
	"language" "language" DEFAULT 'en' NOT NULL,
	"source" "report_source" DEFAULT 'web' NOT NULL,
	"device_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_confirmations" ADD CONSTRAINT "report_confirmations_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "report_confirmations_report_id_device_hash_index" ON "report_confirmations" USING btree ("report_id","device_hash");--> statement-breakpoint
CREATE INDEX "report_confirmations_report_id_created_at_index" ON "report_confirmations" USING btree ("report_id","created_at");