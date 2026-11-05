import type { RequestHandler, Response } from "express";

import type { AuthUser, Reader } from "#modules/auth/schema";
import { verifySession } from "#modules/auth/service";
import { sessionCookie } from "#shared/config/cookies";
import { readCookie } from "#shared/http/cookies";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const sessionValue = readCookie(request, sessionCookie.name);

  response.locals.auth = await verifySession(sessionValue);
  next();
};

/**
 * Tells the admin apart from a visitor on a public read, for readerOf. A request without a session
 * is a visitor's; a request with one is checked as requireAuth checks it, so a session that has
 * ended is refused with 401 rather than read as a visitor's: the admin learns the session ended
 * instead of seeing the hidden content vanish. The answer depends on the session cookie, so a
 * shared cache keys it by the cookie and never keeps the admin's.
 */
export const identifyReader: RequestHandler = async (request, response, next) => {
  const sessionValue = readCookie(request, sessionCookie.name);

  response.vary("Cookie");

  if (sessionValue) {
    response.locals.auth = await verifySession(sessionValue);
    response.set("Cache-Control", "private, no-cache");
  }

  next();
};

/** The reader identifyReader found. */
export function readerOf(locals: Pick<Response["locals"], "auth">): Reader {
  return locals.auth ? "admin" : "visitor";
}

/** The admin set by requireAuth, for handlers mounted after it. */
export function authenticatedUser(locals: Pick<Response["locals"], "auth">): AuthUser {
  if (!locals.auth) {
    throw new Error("requireAuth must run before the handler that reads the admin");
  }

  return locals.auth;
}
