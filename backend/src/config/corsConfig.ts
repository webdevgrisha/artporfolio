import type { CorsOptions } from "cors";
import { z } from "zod";

import { ForbiddenError } from "#errors/httpError";

const originSchema = z.url().refine((origin) => {
  const url = new URL(origin);
  return ["http:", "https:"].includes(url.protocol) && url.origin === origin;
}, "CORS_ORIGINS must contain valid HTTP origins");

const defaultCorsOrigins =
  process.env.NODE_ENV === "test" || process.env.FUNCTIONS_EMULATOR === "true"
    ? "http://localhost:5173"
    : "";

const corsOrigins = new Set(
  z
    .array(originSchema)
    .min(1, "CORS_ORIGINS must contain at least one origin")
    .parse(
      (process.env.CORS_ORIGINS ?? defaultCorsOrigins)
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
);

export const corsOptions: CorsOptions = {
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  credentials: true,
  maxAge: 600,
  methods: ["GET", "POST"],
  origin(origin, callback) {
    if (!origin || corsOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new ForbiddenError("Origin is not allowed"));
  },
};
