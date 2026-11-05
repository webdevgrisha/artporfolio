import type { CorsOptions } from "cors";

import { getEnv } from "#shared/config/env";
import { ForbiddenError } from "#shared/http/errors";

export const corsOptions: CorsOptions = {
  // If-Match changes a resource read before; If-None-Match: * creates one at an id the client picked.
  allowedHeaders: ["Content-Type", "If-Match", "If-None-Match", "X-CSRF-Token"],
  credentials: true,
  // The admin reads the ETag of a list to send it back in If-Match.
  exposedHeaders: ["ETag"],
  maxAge: 600,
  methods: ["GET", "POST", "PUT", "DELETE"],
  origin(origin, callback) {
    if (!origin || getEnv().corsOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new ForbiddenError("Origin is not allowed"));
  },
};
