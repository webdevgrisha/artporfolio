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
    // Instead of the default 80 requests per instance. Encoding a 50-megapixel photo takes about
    // 150 MiB and one CPU for several seconds, so four uploads at once still fit in the memory
    // and in the 60 seconds that Firebase Hosting waits. The admin sends at most two at once.
    concurrency: 4,
    timeoutSeconds: 120,
    region: "europe-west1",
    secrets: [csrfSecret],
  },
  server,
);
