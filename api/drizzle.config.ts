import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./api/src/db/schema.ts",
  out: "./api/drizzle",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
