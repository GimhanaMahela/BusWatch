// Applies pending SQL migrations from api/drizzle. Run with `npm run db:migrate`
// (Docker runs the compiled version before starting the server). Uses DATABASE_DIRECT_URL when set:
// on Supabase, migrations go through the direct or session connection, not the pooler.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { migrationConnection } from "./connection.js";

// Same relative path from src/db (tsx) and dist/db (compiled)
export const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

const pool = new Pool({ ...migrationConnection(), max: 1 });

try {
  await migrate(drizzle(pool, { casing: "snake_case" }), { migrationsFolder });
  console.log("Database migrations applied.");
} finally {
  await pool.end();
}
