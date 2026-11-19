import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Next builds the app; Vitest only runs the component tests.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    name: "ui",
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Full-form tests type into MUI fields under jsdom; with every file running in parallel
    // they can pass 5s on a busy machine (CI included)
    testTimeout: 20_000,
  },
});
