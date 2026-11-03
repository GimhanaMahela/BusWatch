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
  images: {
    // Report media is hosted on Cloudinary
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // The UI calls /api on its own origin; Next forwards it to the API
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUpstream}/api/:path*` },
      { source: "/health", destination: `${apiUpstream}/health` },
    ];
  },
};

export default nextConfig;
