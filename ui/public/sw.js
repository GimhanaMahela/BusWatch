/* BusWatch service worker: keeps the passenger pages usable without a signal.
 *
 * Hand-written on purpose (no build plugin), so it works with Turbopack and stays easy to read.
 * - Pages: network first (with a short timeout), falling back to the last cached copy, then /offline.
 * - Static assets (/_next/static, icons, fonts): cache first; they are content-hashed.
 * - API calls, admin pages and React Server Component fetches always go to the network.
 * Reports written while offline are kept in IndexedDB by the page itself and sent when the
 * connection returns (see ui/src/lib/offlineStore.ts).
 * - Push: shows "your report was updated" notifications and opens the report when tapped.
 *   Development registers this file as /sw.js?mode=push-only, which skips all caching.
 *
 * Bump VERSION to drop every old cache on the next visit.
 */
const VERSION = "v1";
const PAGE_CACHE = `buswatch-pages-${VERSION}`;
const ASSET_CACHE = `buswatch-assets-${VERSION}`;
const OFFLINE_URL = "/offline";
const NETWORK_TIMEOUT_MS = 4000;
const MAX_ASSETS = 400;
const PUSH_ONLY = new URL(self.location.href).searchParams.get("mode") === "push-only";

// Pages a passenger may need on the bus. Their scripts and styles are cached alongside.
const PRECACHE_PAGES = ["/", "/submit-report", "/commend-a-driver", "/track", OFFLINE_URL];
const PRECACHE_ASSETS = ["/manifest.json", "/favicon.ico", "/logo192.png", "/logo512.png"];

const STATIC_ASSET = /^\/_next\/(static|image)\/|\.(?:png|jpe?g|svg|ico|webp|woff2?)$/;
const NEXT_ASSET_URLS = /\/_next\/static\/[^"'\s)\\]+/g;

const cacheAssetsReferencedBy = async (html) => {
  const assets = await caches.open(ASSET_CACHE);
  const urls = [...new Set(html.match(NEXT_ASSET_URLS) ?? [])];
  await Promise.all(urls.map((url) => assets.add(url).catch(() => undefined)));
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (PUSH_ONLY) {
        await self.skipWaiting();
        return;
      }
      const assets = await caches.open(ASSET_CACHE);
      await assets.addAll(PRECACHE_ASSETS).catch(() => undefined);
      const pages = await caches.open(PAGE_CACHE);
      await Promise.all(
        PRECACHE_PAGES.map(async (url) => {
          try {
            const response = await fetch(url, { credentials: "same-origin" });
            if (!response.ok) return;
            await pages.put(url, response.clone());
            await cacheAssetsReferencedBy(await response.text());
          } catch {
            // Offline during install: these pages get cached on the next visit instead
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PAGE_CACHE, ASSET_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("buswatch-") && !keep.has(n)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Content-hashed assets pile up across deployments; drop the oldest beyond MAX_ASSETS. */
const trimAssets = async () => {
  const cache = await caches.open(ASSET_CACHE);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(keys.length - MAX_ASSETS, 0)).map((k) => cache.delete(k)));
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    await cache.put(request, response.clone());
    void trimAssets();
  }
  return response;
};

const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve(null), ms));

/** Pages are cached by path only, so /submit-report?bus=NB-1234 works offline too. */
const networkFirstPage = async (event) => {
  const url = new URL(event.request.url);
  const cache = await caches.open(PAGE_CACHE);

  const network = fetch(event.request)
    .then(async (response) => {
      if (response.ok && response.type === "basic") {
        await cache.put(url.pathname, response.clone());
        void cacheAssetsReferencedBy(await response.clone().text());
      }
      return response;
    })
    .catch(() => null);
  // Keep updating the cache even when the timeout wins
  event.waitUntil(network);

  const response = await Promise.race([network, timeout(NETWORK_TIMEOUT_MS)]);
  if (response) return response;

  const cached = (await cache.match(url.pathname)) ?? null;
  if (cached) return cached;
  // Still waiting on a slow network and nothing cached: give it the rest of the time
  const late = await network;
  return late ?? (await cache.match(OFFLINE_URL)) ?? Response.error();
};

self.addEventListener("fetch", (event) => {
  if (PUSH_ONLY) return;
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Always live: the API, the admin console, QR short links and the worker itself
  if (/^\/(api|admin|r)(\/|$)/.test(url.pathname) || url.pathname === "/sw.js") return;
  // Client-side navigation payloads; if they fail, Next falls back to a full page load
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
    return;
  }
  if (STATIC_ASSET.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

// ---------------------------------------------------------------- Push notifications

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const url = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/track";
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || "BusWatch", {
        body: data.body || "",
        tag: data.tag,
        renotify: Boolean(data.tag),
        icon: "/logo192.png",
        badge: "/logo192.png",
        data: { url },
      });
      // An open tracking page refreshes itself
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      windows.forEach((client) => client.postMessage({ type: "report-updated", url }));
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/track", self.location.origin);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).pathname === url.pathname);
      if (open) {
        await open.focus();
        return;
      }
      await self.clients.openWindow(url.href);
    })(),
  );
});
