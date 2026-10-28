import type { RequestHandler } from "express";
import type { LoginBody } from "#modules/auth/schema";
import { createSession, revokeSession } from "#modules/auth/service";
import { sessionCookie } from "#shared/config/cookies";
import {
  clearCsrfCookie,
  clearSessionCookie,
  readCookie,
  setSessionCookie,
} from "#shared/http/cookies";

export const login: RequestHandler<object, unknown, LoginBody> = async (request, response) => {
  const session = await createSession(request.body.idToken);

  setSessionCookie(response, session.sessionCookie);
  clearCsrfCookie(response);
  response.status(200).json({ user: session.user });
};

export const logout: RequestHandler = async (request, response) => {
  const sessionValue = readCookie(request, sessionCookie.name);

  clearSessionCookie(response);
  clearCsrfCookie(response);

  await revokeSession(sessionValue);
  response.status(204).end();
};

export const me: RequestHandler = (_request, response) => {
  response.status(200).json({ user: response.locals.auth });
};
