/**
 * The Cloud Function that serves the public site: the handler of the built Astro server, which
 * renders pages and serves their assets. Firebase Hosting rewrites every path the admin and the
 * API do not take to it.
 */
import "./no-autostart.js";

import { onRequest } from "firebase-functions/v2/https";

import { handler } from "./dist/server/entry.mjs";

export const site = onRequest(
  {
    // Caps the cost of a traffic spike; a CDN answers most requests before they reach it.
    maxInstances: 10,
    region: "europe-west1",
  },
  handler,
);
