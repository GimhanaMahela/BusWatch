import { trackEvent } from "@/api/metricsApi";

// Installable app support: registers the service worker (public/sw.js) and keeps the browser's
// install prompt so an "Install the app" button can show it later.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialised = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Runs once, as early as possible: Chrome fires beforeinstallprompt soon after load. */
export const initPwa = () => {
  if (initialised || typeof window === "undefined") return;
  initialised = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // we show our own button instead of the mini-infobar
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
    trackEvent("app_installed");
  });

  // Development servers rebuild constantly; caching their output would only get in the way
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.warn("Service worker registration failed:", error);
      });
    });
  }
};

export const subscribeInstallPrompt = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const canInstall = () => deferredPrompt !== null;

/** Shows the browser's install dialog. Resolves true when the passenger accepted. */
export const promptInstall = async () => {
  const prompt = deferredPrompt;
  if (!prompt) return false;
  deferredPrompt = null;
  notify();
  await prompt.prompt();
  return (await prompt.userChoice).outcome === "accepted";
};

if (typeof window !== "undefined") initPwa();
