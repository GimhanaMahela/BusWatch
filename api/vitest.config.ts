import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api",
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // One in-process PGlite database per test file (tests/setup.ts); files run one at a time
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
