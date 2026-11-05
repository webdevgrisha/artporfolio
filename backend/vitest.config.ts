import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // tests/front-rules.test.ts reads the rules the front repeats.
    alias: { "@": fileURLToPath(new URL("../front/src", import.meta.url)) },
  },
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
