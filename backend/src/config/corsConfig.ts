import type { CorsOptions } from "cors";

import { getEnv } from "#config/env";
import { ForbiddenError } from "#errors/httpError";

export const corsOptions: CorsOptions = {
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  credentials: true,
  maxAge: 600,
  methods: ["GET", "POST"],
  origin(origin, callback) {
    if (!origin || getEnv().corsOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new ForbiddenError("Origin is not allowed"));
  },
};
