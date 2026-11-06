CREATE TYPE "public"."contact_channel" AS ENUM('email', 'phone');--> statement-breakpoint
CREATE TYPE "public"."message_sender" AS ENUM('admin', 'passenger');--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'my_reports_signin';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'admin_message';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'passenger_message';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'push_subscribed';--> statement-breakpoint
CREATE TABLE "passenger_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"destination" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"sender" "message_sender" NOT NULL,
	"body" text NOT NULL,
	"author" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "passenger_phone" text;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passenger_codes_destination_created_at_index" ON "passenger_codes" USING btree ("destination","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_report_id_endpoint_index" ON "push_subscriptions" USING btree ("report_id","endpoint");--> statement-breakpoint
CREATE INDEX "push_subscriptions_endpoint_index" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "report_messages_report_id_created_at_index" ON "report_messages" USING btree ("report_id","created_at");--> statement-breakpoint
CREATE INDEX "reports_passenger_email_index" ON "reports" USING btree ("passenger_email");--> statement-breakpoint
CREATE INDEX "reports_passenger_phone_index" ON "reports" USING btree ("passenger_phone");