import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api",
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // One in-memory MongoDB per test file; files run one at a time to keep memory low
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
