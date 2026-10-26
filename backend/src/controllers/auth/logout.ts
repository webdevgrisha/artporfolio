import type { RequestHandler } from "express";

import { sessionCookie } from "#config/cookies";
import { clearCsrfCookie, clearSessionCookie, readCookie } from "#http/cookies/index";
import { revokeSession } from "#services/auth/index";

export const logout: RequestHandler = async (request, response) => {
  const sessionValue = readCookie(request, sessionCookie.name);

  clearSessionCookie(response);
  clearCsrfCookie(response);

  await revokeSession(sessionValue);
  response.status(204).end();
};
