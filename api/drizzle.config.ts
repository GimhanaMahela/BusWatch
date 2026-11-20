import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./api/src/db/schema.ts",
  out: "./api/drizzle",
  casing: "snake_case",
  // `db:generate` needs no database; `db:studio` uses the direct connection when there is one
  dbCredentials: { url: process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL || "" },
});
