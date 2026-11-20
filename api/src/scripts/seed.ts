// Fills the database with sample data for local development and demos:
//
//   npm run db:seed                  seed an empty, migrated database
//   npm run db:seed -- --reset       wipe every table first (asks for nothing: be sure!)
//   npm run db:seed -- --allow-remote   also allow a database that isn't on this machine
//
// SEED_PASSWORD sets the password for every seeded account (default in db/seed/catalogue.ts).
// It refuses to run with NODE_ENV=production, and on a non-local database unless --allow-remote
// is given, so a stray command can't fill (or wipe) a live database.
import { env } from "../config/env.js";
import { pool, db } from "../db/client.js";
import { hasData, resetDatabase, seedDatabase } from "../db/seed/seed.js";

const args = new Set(process.argv.slice(2));
const reset = args.has("--reset");
const allowRemote = args.has("--allow-remote");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "postgres"]);

const databaseHost = () => {
  try {
    return new URL(env.DATABASE_URL).hostname;
  } catch {
    return "(socket)";
  }
};

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

try {
  if (env.NODE_ENV === "production") fail("Refusing to seed with NODE_ENV=production.");

  const host = databaseHost();
  if (!LOCAL_HOSTS.has(host) && host !== "(socket)" && !allowRemote) {
    fail(
      `DATABASE_URL points at ${host}, which isn't a local database.\n` +
        "Seed data is fake: if you really want it there, run again with --allow-remote.",
    );
  }

  if (await hasData(db)) {
    if (!reset) {
      fail(
        "The database already has accounts or reports. Run with --reset to wipe every table " +
          "and seed from scratch.",
      );
    }
    console.log(`Wiping every table on ${host}...`);
    await resetDatabase(db);
  }

  console.log(`Seeding ${host}...`);
  const summary = await seedDatabase(db, { password: process.env.SEED_PASSWORD || undefined });

  console.log("\nDone. Created:");
  for (const [table, n] of Object.entries(summary.counts)) {
    console.log(`  ${table.padEnd(18)} ${n}`);
  }
  console.log(`\nEvery account's password: ${summary.password}`);
  console.log("\nStaff (sign in at /admin/login):");
  for (const s of summary.staff) console.log(`  ${s.email.padEnd(32)} ${s.role}`);
  console.log("\nOperators (same sign-in page; they land in the operator portal):");
  for (const o of summary.operators) {
    console.log(
      `  ${o.email.padEnd(32)} ${o.organisation} (${o.buses.join(", ") || "no buses yet"})`,
    );
  }
  console.log(`\nLive shared trip:     ${summary.liveTripPath}`);
  console.log(`Reports with a chat:  ${summary.sampleReceiptIds.join(", ")}`);
  console.log(
    '"My reports": sign in as passenger.demo@example.com; with email off, the code is printed in the API log.',
  );
} finally {
  await pool.end();
}
