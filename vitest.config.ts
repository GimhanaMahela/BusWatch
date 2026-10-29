import { defineConfig } from "vitest/config";

// Each app keeps its own test environment; `npm test` runs both.
export default defineConfig({
  test: {
    projects: ["api", "ui"],
  },
});
