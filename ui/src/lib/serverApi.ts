// Server only: uses next/headers.
import { headers } from "next/headers";

// Server components and route handlers call the API directly. Docker sets API_UPSTREAM to the
// API container; elsewhere (local dev, Vercel) this site's own /api reaches it.
const apiBase = async () => {
  if (process.env.API_UPSTREAM) return `${process.env.API_UPSTREAM.replace(/\/$/, "")}/api`;
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? `localhost:${process.env.PORT ?? 3000}`;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/api`;
};

// On Vercel, preview (and *.vercel.app) deployments sit behind Deployment Protection, which answers
// this server's own /api calls with its login page. With "Protection Bypass for Automation" on,
// Vercel provides this secret, and the header lets the call through to the API.
export const internalApiHeaders = (): Record<string, string> =>
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
    : {};

export class PublicDataError extends Error {}

/**
 * GETs a public API path. Results are cached by Next for `revalidate` seconds, so public pages
 * refresh every few minutes instead of querying the database on every visit.
 * Returns null on 404; throws PublicDataError when the API can't be reached.
 */
export const fetchPublic = async <T>(path: string, revalidate = 300): Promise<T | null> => {
  // Outside the try: headers() signals Next that the page is dynamic, which must not be swallowed
  const base = await apiBase();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      headers: internalApiHeaders(),
      next: { revalidate, tags: ["public"] },
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    throw new PublicDataError(error instanceof Error ? error.message : "API unreachable");
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new PublicDataError(`API responded ${response.status}`);
  // Anything but JSON (a proxy or login page) means the API wasn't reached
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new PublicDataError("API responded with a non-JSON page");
  }
  return (await response.json()) as T;
};
