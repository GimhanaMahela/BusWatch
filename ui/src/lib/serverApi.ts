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
      next: { revalidate, tags: ["public"] },
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    throw new PublicDataError(error instanceof Error ? error.message : "API unreachable");
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new PublicDataError(`API responded ${response.status}`);
  return (await response.json()) as T;
};
