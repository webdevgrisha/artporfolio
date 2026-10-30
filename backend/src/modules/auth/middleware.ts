import type { RequestHandler, Response } from "express";

import type { AuthUser } from "#modules/auth/schema";
import { verifySession } from "#modules/auth/service";
import { sessionCookie } from "#shared/config/cookies";
import { readCookie } from "#shared/http/cookies";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const sessionValue = readCookie(request, sessionCookie.name);

  response.locals.auth = await verifySession(sessionValue);
  next();
};

/** The admin set by requireAuth, for handlers mounted after it. */
export function authenticatedUser(locals: Pick<Response["locals"], "auth">): AuthUser {
  if (!locals.auth) {
    throw new Error("requireAuth must run before the handler that reads the admin");
  }

  return locals.auth;
}
