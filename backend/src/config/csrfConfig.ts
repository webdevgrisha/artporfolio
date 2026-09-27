import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";
import { z } from "zod";

import { authCookieNames, cookieSecure } from "#config/authConfig";

const csrfSecretSchema = z.string().trim().min(32);

export const csrfCookieName = cookieSecure ? "__Host-admin_csrf" : "admin_csrf";

export const csrfCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "strict" as const,
  secure: cookieSecure,
};

function getSessionIdentifier(request: Request): string {
  const sessionCookie = request.cookies?.[authCookieNames.session];
  return typeof sessionCookie === "string" ? sessionCookie : "anonymous";
}

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  cookieName: csrfCookieName,
  cookieOptions: csrfCookieOptions,
  errorConfig: {
    code: "INVALID_CSRF_TOKEN",
    message: "Invalid CSRF token",
    statusCode: 403,
  },
  getCsrfTokenFromRequest: (request) => request.get("X-CSRF-Token"),
  getSecret: () => csrfSecretSchema.parse(process.env.CSRF_SECRET),
  getSessionIdentifier,
});
