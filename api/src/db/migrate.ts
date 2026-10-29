// Applies pending SQL migrations from api/drizzle. Run with `npm run db:migrate`
// (Docker runs the compiled version before starting the server).
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { db, pool } from "./client.js";

// Same relative path from src/db (tsx) and dist/db (compiled)
export const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

try {
  await migrate(db, { migrationsFolder });
  console.log("Database migrations applied.");
} finally {
  await pool.end();
}
