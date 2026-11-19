import { ApiError } from "@/api/apiClient";

// Cloudflare Turnstile (CAPTCHA) for public submissions. Most passengers never see it: the widget
// runs invisibly and only shows a challenge when Cloudflare is unsure. Tokens are fetched right
// before each send, so reports queued offline get a fresh one when they finally go out.
// Without NEXT_PUBLIC_TURNSTILE_SITE_KEY (development, tests) nothing is loaded.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TOKEN_TIMEOUT_MS = 60_000; // includes time for a passenger to solve a visible challenge

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const isTurnstileEnabled = () => Boolean(SITE_KEY);

let scriptPromise: Promise<TurnstileApi> | null = null;
const loadScript = () => {
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing"));
    script.onerror = () => reject(new Error("Could not load the security check"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    scriptPromise = null; // offline now; try again next time
    throw error;
  });
  return scriptPromise;
};

let widget: { id: string; container: HTMLElement } | null = null;
let pending: { resolve: (token: string) => void; reject: (error: Error) => void } | null = null;

const ensureWidget = (api: TurnstileApi) => {
  if (widget) return widget;
  // Fixed in a corner; empty (invisible) unless Cloudflare needs the passenger to tick a box
  const container = document.createElement("div");
  container.setAttribute("aria-live", "polite");
  Object.assign(container.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: "2000",
  });
  document.body.appendChild(container);
  const id = api.render(container, {
    sitekey: SITE_KEY,
    execution: "execute",
    appearance: "interaction-only",
    callback: (token: string) => pending?.resolve(token),
    "error-callback": () => pending?.reject(new Error("The security check failed")),
    "expired-callback": () => pending?.reject(new Error("The security check expired")),
  });
  widget = { id, container };
  return widget;
};

/**
 * A fresh Turnstile token, or null when Turnstile isn't configured. Errors come back as an
 * ApiError without a status, which the form treats like a lost connection (so offline reports
 * are kept and retried rather than lost).
 */
export const getTurnstileToken = async (): Promise<string | null> => {
  if (!SITE_KEY || typeof window === "undefined") return null;
  try {
    const api = await loadScript();
    const { id } = ensureWidget(api);
    pending?.reject(new Error("Superseded"));
    const token = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("The security check timed out")),
        TOKEN_TIMEOUT_MS,
      );
      pending = {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
      api.reset(id);
      api.execute(id);
    });
    return token;
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Security check failed");
  } finally {
    pending = null;
  }
};
