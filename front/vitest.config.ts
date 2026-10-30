import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        include: ["src/**"],
        provider: "v8",
        reporter: ["text", "html"],
        reportsDirectory: "coverage",
      },
      // The app runs in a browser: the code relies on its globals, and `http` sends requests to
      // paths relative to the page.
      environment: "happy-dom",
      include: ["tests/**/*.test.{ts,tsx}"],
      setupFiles: ["tests/setup.ts"],
    },
  }),
);
