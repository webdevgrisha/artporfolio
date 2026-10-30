import { z } from "zod";

export const isLocalRuntime =
  process.env.NODE_ENV === "test" || process.env.FUNCTIONS_EMULATOR === "true";

const originSchema = z.url().refine((origin) => {
  const url = new URL(origin);
  return ["http:", "https:"].includes(url.protocol) && url.origin === origin;
}, "CORS_ORIGINS must contain valid HTTP origins");

const envSchema = z.object({
  ADMIN_UID: z.string().trim().min(1),
  CORS_ORIGINS: z
    .string()
    .default(isLocalRuntime ? "http://localhost:5173" : "")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(originSchema).min(1, "CORS_ORIGINS must contain at least one origin")),
  SESSION_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(14 * 24 * 60)
    .default(60),
});

interface Env {
  adminUid: string;
  corsOrigins: ReadonlySet<string>;
  sessionTtlMilliseconds: number;
}

let env: Env | undefined;

/**
 * Validated on first use and cached. Firebase loads this module during deploy, before the
 * runtime environment exists, so the variables cannot be read at import time.
 * CSRF_SECRET is a Secret Manager value and is read separately by the CSRF middleware.
 */
export function getEnv(): Env {
  if (!env) {
    const parsed = envSchema.parse(process.env);

    env = Object.freeze({
      adminUid: parsed.ADMIN_UID,
      corsOrigins: new Set(parsed.CORS_ORIGINS),
      sessionTtlMilliseconds: parsed.SESSION_TTL_MINUTES * 60 * 1_000,
    });
  }

  return env;
}
