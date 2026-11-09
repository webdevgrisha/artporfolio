import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
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
});
