ALTER TYPE "public"."admin_role" ADD VALUE 'operator';--> statement-breakpoint
ALTER TYPE "public"."metric_event" ADD VALUE 'operator_response';--> statement-breakpoint
CREATE TABLE "operator_buses" (
	"operator_id" uuid NOT NULL,
	"bus_number" text NOT NULL,
	CONSTRAINT "operator_buses_operator_id_bus_number_pk" PRIMARY KEY("operator_id","bus_number")
);
--> statement-breakpoint
CREATE TABLE "operator_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"operator_id" uuid,
	"organisation" text,
	"body" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "organisation" text;--> statement-breakpoint
ALTER TABLE "operator_buses" ADD CONSTRAINT "operator_buses_operator_id_admins_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_responses" ADD CONSTRAINT "operator_responses_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_responses" ADD CONSTRAINT "operator_responses_operator_id_admins_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "operator_buses_bus_number_index" ON "operator_buses" USING btree ("bus_number");--> statement-breakpoint
CREATE INDEX "operator_responses_report_id_created_at_index" ON "operator_responses" USING btree ("report_id","created_at");