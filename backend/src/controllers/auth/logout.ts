import type { RequestHandler } from "express";

import { authCookieNames } from "#config/authConfig";
import { clearCsrfCookie, clearSessionCookie, readCookie } from "#http/cookies/index";
import { revokeSession } from "#services/auth/index";

export const logout: RequestHandler = async (request, response, next) => {
  const sessionCookie = readCookie(request, authCookieNames.session);

  clearSessionCookie(response);
  clearCsrfCookie(response);

  try {
    await revokeSession(sessionCookie);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
};
