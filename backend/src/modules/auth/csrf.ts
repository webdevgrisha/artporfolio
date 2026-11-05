import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { z } from "zod";

import { readSessionCookie } from "#modules/auth/session-cookie";
import { getEnv } from "#shared/config/env";
import { ForbiddenError, UnauthorizedError } from "#shared/http/errors";

/** The client sends the token back in the X-CSRF-Token header of every change. */
export const csrfTokenResponseSchema = z.object({
  csrfToken: z.string(),
});

export type CsrfTokenResponse = z.infer<typeof csrfTokenResponseSchema>;

/**
 * The token of a session is an HMAC of its cookie. Only a page allowed to read the API responses
 * gets it, and every tab of a session gets the same one. A new session has a new token, so the
 * token of an ended session is rejected. Firebase Hosting passes no cookie but the session one,
 * so the token cannot be kept in a second cookie.
 */
function csrfTokenFor(session: string): string {
  return createHmac("sha256", getEnv().csrfSecret).update(session).digest("base64url");
}

export const issueCsrfToken: RequestHandler<object, CsrfTokenResponse> = (request, response) => {
  const session = readSessionCookie(request);

  if (!session) {
    throw new UnauthorizedError();
  }

  response.status(200).json({ csrfToken: csrfTokenFor(session) });
};

export const requireCsrfToken: RequestHandler = (request, _response, next) => {
  const session = readSessionCookie(request);

  // A forged request acts with the cookies of the browser. Without a session cookie it has nothing
  // to act with, and what needs a session rejects it in verifySession.
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
