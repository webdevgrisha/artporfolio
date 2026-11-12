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
      // Its fallback, fitted to it, is in styles/fonts.css: the generic family Astro would end it
      // with must come last of all the fonts, after those of Chinese, Japanese and Korean (see the
      // tokens of typography).
      fallbacks: [],
      name: "Absans",
      options: {
        variants: [
          { src: ["./src/assets/fonts/Absans-Regular.woff2"], style: "normal", weight: 400 },
        ],
      },
      provider: fontProviders.local(),
    },
    // Absans has Latin letters only. Each other script of the languages of the site has a font of its
    // own, as near to Absans in shape and weight as there is, for its letters only (the subsets of
    // Google, each with its unicode-range): a page loads one only when it shows that script.
    // Where the font in Regular is darker than Absans, its Light matches it. None has a fallback
    // of its own: the tokens of typography end the list with one for all of them.
    {
      cssVariable: "--font-manrope",
      fallbacks: [],
      name: "Manrope",
      provider: fontProviders.google(),
      subsets: ["cyrillic", "greek"],
      weights: [400],
    },
    {
      cssVariable: "--font-readex-pro",
      fallbacks: [],
      name: "Readex Pro",
      provider: fontProviders.google(),
      subsets: ["arabic"],
      weights: [300],
    },
    {
      cssVariable: "--font-poppins",
      fallbacks: [],
      name: "Poppins",
      provider: fontProviders.google(),
      // Poppins has an italic too, which the site never sets.
      styles: ["normal"],
      subsets: ["devanagari"],
      weights: [300],
    },
    {
      cssVariable: "--font-noto-sans-kr",
      fallbacks: [],
      name: "Noto Sans KR",
      provider: fontProviders.google(),
      subsets: ["korean"],
      weights: [300],
    },
    {
      cssVariable: "--font-noto-sans-sc",
      fallbacks: [],
      name: "Noto Sans SC",
      provider: fontProviders.google(),
      subsets: ["chinese-simplified"],
      weights: [300],
    },
    {
      cssVariable: "--font-noto-sans-jp",
      fallbacks: [],
      name: "Noto Sans JP",
      provider: fontProviders.google(),
      subsets: ["japanese"],
      weights: [300],
    },
  ],
  output: "server",
  // A link of the site fetches its page as the pointer rests on it, or as a finger touches it, so
  // the page opens at once on the click. Astro skips it on a slow connection or with data saving.
  prefetch: { defaultStrategy: "hover", prefetchAll: true },
});
