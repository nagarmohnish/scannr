import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

// Load .env.local for tests so engine keys are available when RUN_LIVE_TESTS=true.
loadEnv({ path: resolve(__dirname, ".env.local") });

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    testTimeout: 60_000,
    hookTimeout: 30_000,
    pool: "forks",
    setupFiles: ["tests/setup.ts"],
    reporters: ["default"],
  },
});
