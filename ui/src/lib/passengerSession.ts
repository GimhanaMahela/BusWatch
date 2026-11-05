import type { PassengerContactInfo } from "@/types/report";

// The "My reports" session (from a one-time code). Kept apart from the admin token: it lives under
// its own key and is only ever sent in the x-passenger-token header.

const KEY = "buswatch:passenger";

export interface PassengerSession {
  token: string;
  contact: PassengerContactInfo;
}

const listeners = new Set<() => void>();
// useSyncExternalStore needs the same object back while nothing changed
let cachedRaw: string | null = null;
let cached: PassengerSession | null = null;

const read = (): PassengerSession | null => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "null") as PassengerSession | null;
    cached = parsed && typeof parsed.token === "string" ? parsed : null;
  } catch {
    cached = null;
  }
  return cached;
};

export const passengerSession = {
  get: read,
  getServer: (): PassengerSession | null => null,
  set(session: PassengerSession | null) {
    try {
      if (session) localStorage.setItem(KEY, JSON.stringify(session));
      else localStorage.removeItem(KEY);
    } catch {
      // Storage blocked: the session lasts until the page is closed
    }
    listeners.forEach((notify) => notify());
  },
  subscribe(notify: () => void) {
    listeners.add(notify);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) notify();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(notify);
      window.removeEventListener("storage", onStorage);
    };
  },
};
