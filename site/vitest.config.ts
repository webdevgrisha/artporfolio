/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Astro checks its env schema as the config loads, so where there is no .env, as in CI, the tests
// need these. They never reach these addresses.
process.env.API_URL ??= "https://api.example/api";
process.env.SITE_URL ??= "https://example.com";

export default getViteConfig({
  test: {
    coverage: {
      include: ["src/**"],
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
    },
    include: ["tests/**/*.test.ts"],
  },
});
