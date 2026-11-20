CREATE TYPE "public"."bus_service" AS ENUM('private', 'sltb', 'metro');--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "bus_service" "bus_service";