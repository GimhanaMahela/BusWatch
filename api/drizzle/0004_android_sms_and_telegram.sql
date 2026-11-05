ALTER TYPE "public"."metric_event" ADD VALUE 'telegram_linked';--> statement-breakpoint
CREATE TABLE "telegram_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"chat_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_subscriptions" ADD CONSTRAINT "telegram_subscriptions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_subscriptions_report_id_chat_id_index" ON "telegram_subscriptions" USING btree ("report_id","chat_id");--> statement-breakpoint
CREATE INDEX "telegram_subscriptions_chat_id_index" ON "telegram_subscriptions" USING btree ("chat_id");