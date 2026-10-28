import type { RequestHandler } from "express";

import { verifySession } from "#modules/auth/service";
import { sessionCookie } from "#shared/config/cookies";
import { readCookie } from "#shared/http/cookies";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const sessionValue = readCookie(request, sessionCookie.name);

  response.locals.auth = await verifySession(sessionValue);
  next();
};
