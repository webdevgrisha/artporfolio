import type { RequestHandler } from "express";

import { authCookieNames } from "#config/authConfig";
import { readCookie } from "#http/cookies/index";
import { verifySession } from "#services/auth/index";

export const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    const sessionCookie = readCookie(request, authCookieNames.session);
    response.locals.auth = await verifySession(sessionCookie);
    next();
  } catch (error) {
    next(error);
  }
};
