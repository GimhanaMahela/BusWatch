import { TOKEN_KEY } from "@/api/apiClient";

// The admin token lives in localStorage (the API client reads it on every request).
// This small store lets React subscribe to it, including changes made in other tabs.
const listeners = new Set<() => void>();

const read = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const tokenStore = {
  get: read,
  /** The server never has a token; the client value is applied after hydration. */
  getServer: (): string | null => null,
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage blocked (private mode): the session lasts until reload
    }
    listeners.forEach((notify) => notify());
  },
  subscribe(notify: () => void) {
    listeners.add(notify);
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) notify();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(notify);
      window.removeEventListener("storage", onStorage);
    };
  },
};
