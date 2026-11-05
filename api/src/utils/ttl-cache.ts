import { env } from "../config/env.js";

interface Entry {
  expires: number;
  value: Promise<unknown>;
}

const store = new Map<string, Entry>();

/**
 * Memoises an async result for `ttlMs`, so a busy public page doesn't run the same aggregate
 * queries on every request. In-memory and per instance (fine for numbers that may lag minutes).
 * Disabled in tests, where every request must see the latest data.
 */
export const cached = <T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> => {
  if (env.NODE_ENV === "test") return load();
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;

  const value = load();
  store.set(key, { expires: now + ttlMs, value });
  // Never keep a failure around
  value.catch(() => store.delete(key));
  // Keep the map from growing without bound (e.g. many different bus numbers)
  if (store.size > 1000) {
    for (const [k, entry] of store) if (entry.expires <= now) store.delete(k);
  }
  return value;
};

/** Drops cached results whose key starts with `prefix` (after admins change public content). */
export const invalidateCache = (prefix = "") => {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
};
