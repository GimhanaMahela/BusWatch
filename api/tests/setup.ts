import { vi } from "vitest";

// Runs before each test file, before any app module reads the environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL ??= "postgres://unused-in-tests";

// Swap the node-postgres client for PGlite: real PostgreSQL running in-process,
// migrated with the same SQL files as production. No database server needed.
vi.mock("../src/db/client.js", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { fileURLToPath } = await import("node:url");
  const schema = await import("../src/db/schema.js");

  const client = new PGlite();
  const db = drizzle(client, { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });

  return {
    db,
    pool: { end: () => client.close() },
    checkDatabaseConnection: async () => {},
  };
});
