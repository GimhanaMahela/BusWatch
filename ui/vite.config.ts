/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

// The monorepo has one .env at the repo root, shared with the API.
// Vite only exposes VITE_* variables to the browser, so API secrets stay server-side.
const envDir = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  const apiPort = env.PORT || "5000";

  return {
    plugins: [react()],
    envDir,
    server: {
      port: 3000,
      // The UI calls /api on its own origin; in development Vite forwards it to the API
      proxy: { "/api": `http://localhost:${apiPort}` },
    },
    preview: { port: 3000, proxy: { "/api": `http://localhost:${apiPort}` } },
    test: {
      name: "ui",
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
