import node from "@astrojs/node";
import { defineConfig, envField, fontProviders } from "astro/config";

export default defineConfig({
  // Pages are rendered on request, so a change in the admin shows at once; a CDN caches them.
  // In standalone mode the handler serves the built files too, so the function of Firebase that
  // wraps it (firebase.js) deploys the pages and their assets together, never out of step.
  adapter: node({ mode: "standalone" }),
  env: {
    schema: {
      // Where the site is served, such as https://example.com: canonical and alternate links,
      // link cards and the sitemap need absolute URLs, and the request may come through a proxy.
      SITE_URL: envField.string({ access: "public", context: "server", url: true }),
      // The API of the backend, which the server of the site asks for the data of a page; the
      // browser of a visitor never calls it.
      API_URL: envField.string({ access: "public", context: "server", url: true }),
    },
  },
  fonts: [
    {
      cssVariable: "--font-absans",
      name: "Absans",
      options: {
        variants: [
          { src: ["./src/assets/fonts/Absans-Regular.woff2"], style: "normal", weight: 400 },
        ],
      },
      provider: fontProviders.local(),
    },
    {
      cssVariable: "--font-manrope",
      // Only the Cyrillic letters: Absans has none, and its own fallback covers the rest.
      fallbacks: [],
      name: "Manrope",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Manrope-Cyrillic-Regular.woff2"],
            style: "normal",
            weight: 400,
          },
        ],
      },
      provider: fontProviders.local(),
      unicodeRange: ["U+0301", "U+0400-045F", "U+0490-0491", "U+04B0-04B1", "U+2116"],
    },
  ],
  output: "server",
  // A link of the site fetches its page as the pointer rests on it, or as a finger touches it, so
  // the page opens at once on the click. Astro skips it on a slow connection or with data saving.
  prefetch: { defaultStrategy: "hover", prefetchAll: true },
});
