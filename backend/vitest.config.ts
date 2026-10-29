import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
    },
    // Fails a test whose responses break the OpenAPI document; see tests/support/contract.ts.
    setupFiles: ["tests/support/setup.ts"],
    // The environment the API expects at runtime; see .env.example.
    env: {
      ADMIN_UID: "admin-uid",
      CSRF_SECRET: "test-csrf-secret-with-at-least-32-characters",
      SESSION_TTL_MINUTES: "60",
    },
  },
});
