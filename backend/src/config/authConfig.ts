import { z } from "zod";

const authEnvSchema = z.object({
  ADMIN_UID: z.string().trim().min(1),
  SESSION_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(14 * 24 * 60)
    .default(60),
});

export const authCookieNames = Object.freeze({
  session: "admin_session",
});

export const recentSignInMaxAgeMilliseconds = 5 * 60 * 1_000;
export const cookieSecure =
  process.env.NODE_ENV !== "test" && process.env.FUNCTIONS_EMULATOR !== "true";

export function getAuthConfig() {
  const env = authEnvSchema.parse({
    ADMIN_UID: process.env.ADMIN_UID,
    SESSION_TTL_MINUTES: process.env.SESSION_TTL_MINUTES,
  });

  return Object.freeze({
    adminUid: env.ADMIN_UID,
    cookieSecure,
    sessionTtlMilliseconds: env.SESSION_TTL_MINUTES * 60 * 1_000,
  });
}
