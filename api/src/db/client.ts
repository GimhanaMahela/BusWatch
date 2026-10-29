import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Serverless functions each hold their own pool; keep it small there
  max: env.VERCEL ? 1 : 10,
});

export const db = drizzle(pool, { schema, casing: "snake_case" });

export type Database = typeof db;

/** Fails fast at startup when the database is unreachable. */
export const checkDatabaseConnection = async (): Promise<void> => {
  const client = await pool.connect();
  client.release();
  console.log("PostgreSQL connected...");
};
