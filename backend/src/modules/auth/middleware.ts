import type { RequestHandler, Response } from "express";

import { requireCsrfToken } from "#modules/auth/csrf";
import type { AuthUser, Reader } from "#modules/auth/schema";
import { verifySession } from "#modules/auth/service";
import { readSessionCookie } from "#modules/auth/session-cookie";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const sessionValue = readSessionCookie(request);

  response.locals.auth = await verifySession(sessionValue);
  next();
};

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Only the admin changes the site, so every change is refused unless it comes from the admin's
 * session with its CSRF token. It runs in front of the routes, so a new route is protected without
 * asking for it. What may run without it, such as signing in, is mounted before it.
 */
export const protectChanges: RequestHandler = async (request, response, next) => {
  if (safeMethods.has(request.method)) {
    next();
    return;
  }

  response.locals.auth = await verifySession(readSessionCookie(request));
  requireCsrfToken(request, response, next);
};

/**
 * Tells the admin apart from a visitor on a public read, for readerOf. A request without a session
 * is a visitor's; a request with one is checked as requireAuth checks it, so a session that has
 * ended is refused with 401 rather than read as a visitor's: the admin learns the session ended
 * instead of seeing the hidden content vanish. The answer depends on the session cookie, so a
 * shared cache keys it by the cookie and never keeps the admin's.
 */
export const identifyReader: RequestHandler = async (request, response, next) => {
  const sessionValue = readSessionCookie(request);

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
