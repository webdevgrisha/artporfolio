import type { RequestHandler } from "express";

import { sessionCookie } from "#config/cookies";
import { readCookie } from "#http/cookies";
import { verifySession } from "#services/auth";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const sessionValue = readCookie(request, sessionCookie.name);

  response.locals.auth = await verifySession(sessionValue);
  next();
};
