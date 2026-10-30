import type { CorsOptions } from "cors";

import { getEnv } from "#shared/config/env";
import { ForbiddenError } from "#shared/http/errors";

export const corsOptions: CorsOptions = {
  allowedHeaders: ["Content-Type", "If-Match", "X-CSRF-Token"],
  credentials: true,
  // The admin reads the ETag of a list to send it back in If-Match.
  exposedHeaders: ["ETag"],
  maxAge: 600,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  origin(origin, callback) {
    if (!origin || getEnv().corsOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new ForbiddenError("Origin is not allowed"));
  },
};
