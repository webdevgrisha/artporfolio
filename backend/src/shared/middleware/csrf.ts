import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { z } from "zod";

import { sessionCookie } from "#shared/config/cookies";
import { readCookie } from "#shared/http/cookies";
import { ForbiddenError, UnauthorizedError } from "#shared/http/errors";

/** The client sends the token back in the X-CSRF-Token header of every change. */
export const csrfTokenResponseSchema = z.object({
  csrfToken: z.string(),
});

export type CsrfTokenResponse = z.infer<typeof csrfTokenResponseSchema>;

const csrfSecretSchema = z.string().trim().min(32);

/**
 * The token of a session is an HMAC of its cookie. Only a page allowed to read the API responses
 * gets it, and every tab of a session gets the same one. A new session has a new token, so the
 * token of an ended session is rejected. Firebase Hosting passes no cookie but the session one,
 * so the token cannot be kept in a second cookie.
 */
function csrfTokenFor(session: string): string {
  return createHmac("sha256", csrfSecretSchema.parse(process.env.CSRF_SECRET))
    .update(session)
    .digest("base64url");
}

export const issueCsrfToken: RequestHandler<object, CsrfTokenResponse> = (request, response) => {
  const session = readCookie(request, sessionCookie.name);

  if (!session) {
    throw new UnauthorizedError();
  }

  response.status(200).json({ csrfToken: csrfTokenFor(session) });
};

export const requireCsrfToken: RequestHandler = (request, _response, next) => {
  const session = readCookie(request, sessionCookie.name);

  // A forged request acts with the cookies of the browser. Without a session cookie it has nothing
  // to act with, and the routes that need a session reject it in requireAuth.
  if (!session) {
    next();
    return;
  }

  const token = Buffer.from(request.get("X-CSRF-Token") ?? "");
  const expected = Buffer.from(csrfTokenFor(session));

  if (token.length !== expected.length || !timingSafeEqual(token, expected)) {
    throw new ForbiddenError("Invalid CSRF token");
  }

  next();
};
