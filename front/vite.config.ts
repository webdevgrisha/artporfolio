import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // The admin lives under /admin of the domain of the site (scripts/build-hosting.mjs).
  base: "/admin/",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Apart from the code of the app, so a deploy keeps them in the cache of the browser.
          groups: [
            { name: "floating-ui", test: /node_modules\/.*(@floating-ui|tabbable)/ },
            { name: "react-router", test: /node_modules\/.*react-router/ },
            { name: "zod", test: /node_modules\/.*zod/ },
          ],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5501/artportfolio-b2ef4/europe-west1/api",
      },
    },
  },
});
