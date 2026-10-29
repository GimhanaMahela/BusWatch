CREATE TYPE "public"."admin_role" AS ENUM('superadmin', 'admin');--> statement-breakpoint
CREATE TYPE "public"."report_category" AS ENUM('reckless_driving', 'overcharging', 'no_ticket', 'refused_to_stop', 'harassment', 'overcrowding', 'loud_music', 'vehicle_condition', 'staff_behaviour', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'escalated', 'resolved', 'rejected');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "report_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"text" text NOT NULL,
	"author" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_status_changes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "report_status_changes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"report_id" uuid NOT NULL,
	"status" "report_status" NOT NULL,
	"note" text,
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" text NOT NULL,
	"bus_number" text NOT NULL,
	"route_number" text NOT NULL,
	"bus_name" text,
	"category" "report_category" DEFAULT 'other' NOT NULL,
	"location" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"description" text NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"videos" text[] DEFAULT '{}' NOT NULL,
	"incident_at" timestamp with time zone,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"passenger_email" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"resolved_at" timestamp with time zone,
	"pdf_url" text,
	CONSTRAINT "reports_receiptId_unique" UNIQUE("receipt_id")
);
--> statement-breakpoint
ALTER TABLE "report_notes" ADD CONSTRAINT "report_notes_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_status_changes" ADD CONSTRAINT "report_status_changes_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_notes_report_id_created_at_index" ON "report_notes" USING btree ("report_id","created_at");--> statement-breakpoint
CREATE INDEX "report_status_changes_report_id_changed_at_index" ON "report_status_changes" USING btree ("report_id","changed_at");--> statement-breakpoint
CREATE INDEX "reports_reported_at_index" ON "reports" USING btree ("reported_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reports_bus_number_reported_at_index" ON "reports" USING btree ("bus_number","reported_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reports_status_index" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_category_index" ON "reports" USING btree ("category");