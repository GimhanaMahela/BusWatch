import type { PoolConfig } from "pg";
import { env } from "../config/env.js";

// Connection settings shared by the app (db/client.ts) and migrations (db/migrate.ts). Works with
// a local or docker-compose Postgres and with hosted Postgres such as Supabase.

/** Hosts reached without TLS by default: this machine and the docker-compose "postgres" service */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "postgres"]);

type SslSetting = "auto" | "on" | "off";

/**
 * Builds pg's settings for a connection string. TLS is decided here, not by `?sslmode=` in the URL:
 * pg reads "sslmode=require" as "verify the certificate against the public CAs", which hosted
 * databases with their own CA (Supabase) fail. With a CA certificate the server is verified;
 * without one the connection is still encrypted.
 */
export const connectionConfig = (
  url: string,
  options: { ssl?: SslSetting; caCert?: string } = {},
): PoolConfig => {
  const ssl = options.ssl ?? "auto";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Not a URL (e.g. a socket path): leave it to pg
    return { connectionString: url };
  }

  const sslmode = parsed.searchParams.get("sslmode");
  parsed.searchParams.delete("sslmode");

  const encrypted =
    ssl === "on" ||
    (ssl === "auto" && (sslmode ? sslmode !== "disable" : !LOCAL_HOSTS.has(parsed.hostname)));

  if (!encrypted) return { connectionString: parsed.toString(), ssl: false };
  const ca = options.caCert?.replace(/\\n/g, "\n").trim();
  return {
    connectionString: parsed.toString(),
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
  };
};

/** The app's connection: DATABASE_URL (on Supabase, the connection pooler). */
export const appConnection = () =>
  connectionConfig(env.DATABASE_URL, { ssl: env.DATABASE_SSL, caCert: env.DATABASE_CA_CERT });

/** Migrations: the direct or session connection when given, otherwise DATABASE_URL. */
export const migrationConnection = () =>
  connectionConfig(env.DATABASE_DIRECT_URL ?? env.DATABASE_URL, {
    ssl: env.DATABASE_SSL,
    caCert: env.DATABASE_CA_CERT,
  });
