import type { RequestHandler } from "express";

import { authenticatedUser } from "#modules/auth/middleware";
import type { AuthUser, LoginBody } from "#modules/auth/schema";
import { createSession, revokeSession } from "#modules/auth/service";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "#modules/auth/session-cookie";

export const login: RequestHandler<object, AuthUser, LoginBody> = async (request, response) => {
  const session = await createSession(request.body.idToken);

  setSessionCookie(response, session.sessionCookie);
  response.status(200).json(session.user);
};

export const logout: RequestHandler = async (request, response) => {
  const sessionValue = readSessionCookie(request);

  clearSessionCookie(response);

  await revokeSession(sessionValue);
  response.status(204).end();
};

export const me: RequestHandler<object, AuthUser> = (_request, response) => {
  response.status(200).json(authenticatedUser(response.locals));
};
