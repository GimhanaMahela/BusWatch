CREATE TABLE "expo_push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expo_push_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "expo_push_tokens" ADD CONSTRAINT "expo_push_tokens_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "expo_push_tokens_report_id_token_index" ON "expo_push_tokens" USING btree ("report_id","token");--> statement-breakpoint
CREATE INDEX "expo_push_tokens_token_index" ON "expo_push_tokens" USING btree ("token");