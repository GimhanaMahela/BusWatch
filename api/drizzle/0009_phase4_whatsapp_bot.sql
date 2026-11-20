ALTER TYPE "public"."metric_event" ADD VALUE 'whatsapp_message';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'whatsapp_linked';--> statement-breakpoint
ALTER TYPE "public"."report_source" ADD VALUE 'whatsapp';--> statement-breakpoint
CREATE TABLE "whatsapp_chats" (
	"phone" text PRIMARY KEY NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"draft" jsonb,
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"awaiting_confirmation" boolean DEFAULT false NOT NULL,
	"last_inbound_at" timestamp with time zone DEFAULT now() NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"window_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_inbound" (
	"message_id" text PRIMARY KEY NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_subscriptions" ADD CONSTRAINT "whatsapp_subscriptions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_inbound_received_at_index" ON "whatsapp_inbound" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_subscriptions_report_id_phone_index" ON "whatsapp_subscriptions" USING btree ("report_id","phone");--> statement-breakpoint
CREATE INDEX "whatsapp_subscriptions_phone_index" ON "whatsapp_subscriptions" USING btree ("phone");