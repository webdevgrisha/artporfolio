import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

import { server } from "#server";

const csrfSecret = defineSecret("CSRF_SECRET");

export const api = onRequest(
  {
    // Caps the cost of a traffic spike; the admin API never needs more.
    maxInstances: 10,
    // Encoding uploaded photos to AVIF needs more than the default 256 MiB and 60 seconds.
    memory: "1GiB",
    timeoutSeconds: 120,
    region: "europe-west1",
    secrets: [csrfSecret],
  },
  server,
);
