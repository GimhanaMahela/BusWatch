import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// The monorepo has one .env at the repo root, shared with the API.
// Next only exposes NEXT_PUBLIC_* variables to the browser, so API secrets stay server-side.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
loadEnvConfig(repoRoot);

// Where /api requests are forwarded: the API container in Docker, the local API in development.
const apiUpstream = (
  process.env.API_UPSTREAM || `http://localhost:${process.env.PORT || 5000}`
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (ui/.next/standalone)
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  reactStrictMode: true,
  poweredByHeader: false,
  // Tree-shake icon and component barrels
  experimental: { optimizePackageImports: ["@mui/icons-material", "@mui/material"] },
  // next-intl loads the site language and messages from src/i18n/request.ts (cookie or
  // Accept-Language; URLs have no locale prefix). This is the one alias its plugin would add;
  // set directly because the plugin checks the path against the working directory, and scripts
  // run from the repo root (`next build ui`) while Turbopack resolves aliases from ui/.
  turbopack: { resolveAlias: { "next-intl/config": "./src/i18n/request.ts" } },
  images: {
    // Report media is hosted on Cloudinary
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    return [
      {
        // The service worker must always be re-checked so updates reach passengers quickly
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  // The UI calls /api on its own origin; Next forwards it to the API
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUpstream}/api/:path*` },
      { source: "/health", destination: `${apiUpstream}/health` },
    ];
  },
};

// Site language from a cookie / Accept-Language (see src/i18n/request.ts); URLs have no locale prefix
export default nextConfig;
