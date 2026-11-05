import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
    },
    // These need the emulators: see vitest.integration.config.ts.
    exclude: [...configDefaults.exclude, "tests/integration/**"],
    // The environment the API expects at runtime; see .env.example.
    env: {
      ADMIN_UID: "admin-uid",
      CSRF_SECRET: "test-csrf-secret-with-at-least-32-characters",
      SESSION_TTL_MINUTES: "60",
    },
  },
});
