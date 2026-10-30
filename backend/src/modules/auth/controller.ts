import type { RequestHandler } from "express";

import { authenticatedUser } from "#modules/auth/middleware";
import type { LoginBody, UserResponse } from "#modules/auth/schema";
import { createSession, revokeSession } from "#modules/auth/service";
import { sessionCookie } from "#shared/config/cookies";
import { clearSessionCookie, readCookie, setSessionCookie } from "#shared/http/cookies";

export const login: RequestHandler<object, UserResponse, LoginBody> = async (request, response) => {
  const session = await createSession(request.body.idToken);

  setSessionCookie(response, session.sessionCookie);
  response.status(200).json({ user: session.user });
};

export const logout: RequestHandler = async (request, response) => {
  const sessionValue = readCookie(request, sessionCookie.name);

  clearSessionCookie(response);

  await revokeSession(sessionValue);
  response.status(204).end();
};

export const me: RequestHandler<object, UserResponse> = (_request, response) => {
  response.status(200).json({ user: authenticatedUser(response.locals) });
};
