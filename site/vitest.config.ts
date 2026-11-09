/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

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
