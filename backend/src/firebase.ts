import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

import { server } from "#server";

const csrfSecret = defineSecret("CSRF_SECRET");

export const api = onRequest(
  {
    region: "europe-west1",
    secrets: [csrfSecret],
  },
  server,
);
