import { doubleCsrf } from "csrf-csrf";
import { z } from "zod";

import { csrfCookie, sessionCookie } from "#config/cookies";
import { readCookie } from "#http/cookies/index";

const csrfSecretSchema = z.string().trim().min(32);

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  cookieName: csrfCookie.name,
  cookieOptions: csrfCookie.options,
  errorConfig: {
    code: "INVALID_CSRF_TOKEN",
    message: "Invalid CSRF token",
    statusCode: 403,
  },
  getCsrfTokenFromRequest: (request) => request.get("X-CSRF-Token"),
  getSecret: () => csrfSecretSchema.parse(process.env.CSRF_SECRET),
  getSessionIdentifier: (request) => readCookie(request, sessionCookie.name) ?? "anonymous",
});
