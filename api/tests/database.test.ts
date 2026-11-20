import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { connectionConfig } from "../src/db/connection.js";
import { db } from "./helpers.js";

// Hosted Postgres (Supabase): TLS settings, and every table closed to Supabase's public Data API.

describe("Database connection settings", () => {
  it("doesn't encrypt local and docker-compose databases", () => {
    for (const url of [
      "postgres://buswatch:buswatch@localhost:5440/buswatch",
      "postgres://buswatch:buswatch@postgres:5432/buswatch",
    ]) {
      expect(connectionConfig(url).ssl).toBe(false);
    }
  });

  it("encrypts hosted databases, and verifies them with a CA certificate", () => {
    const supabase =
      "postgresql://postgres.abcdef:p%40ss@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
    expect(connectionConfig(supabase)).toEqual({
      connectionString: supabase,
      ssl: { rejectUnauthorized: false },
    });
    expect(
      connectionConfig(supabase, { caCert: "-----BEGIN CERTIFICATE-----\\nabc\\n-----END" }).ssl,
    ).toEqual({
      ca: "-----BEGIN CERTIFICATE-----\nabc\n-----END",
      rejectUnauthorized: true,
    });
  });

  it("follows ?sslmode= and DATABASE_SSL, and keeps sslmode away from pg", () => {
    const required = connectionConfig("postgres://u:p@localhost:5432/db?sslmode=require");
    expect(required).toEqual({
      connectionString: "postgres://u:p@localhost:5432/db",
      ssl: { rejectUnauthorized: false },
    });
    expect(connectionConfig("postgres://u:p@db.example.com/db?sslmode=disable").ssl).toBe(false);
    expect(connectionConfig("postgres://u:p@db.example.com/db", { ssl: "off" }).ssl).toBe(false);
    expect(connectionConfig("postgres://u:p@localhost/db", { ssl: "on" }).ssl).toEqual({
      rejectUnauthorized: false,
    });
  });
});

describe("Row level security", () => {
  it("is on for every table, so Supabase's public API can't read or change them", async () => {
    const result = await db.execute<{ table: string; rls: boolean }>(sql`
      SELECT c.relname AS "table", c.relrowsecurity AS rls
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
    `);
    const tables = result.rows;
    expect(tables.length).toBeGreaterThan(10);
    expect(tables.filter((t) => !t.rls).map((t) => t.table)).toEqual([]);
  });
});
