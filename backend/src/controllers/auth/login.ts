import type { RequestHandler } from "express";

import { clearCsrfCookie, setSessionCookie } from "#http/cookies/index";
import type { LoginBody } from "#schemas/auth/index";
import { createSession } from "#services/auth/index";

export const login: RequestHandler<object, unknown, LoginBody> = async (
  request,
  response,
  next,
) => {
  try {
    const session = await createSession(request.body.idToken);

    setSessionCookie(response, session.sessionCookie);
    clearCsrfCookie(response);
    response.status(200).json({ user: session.user });
  } catch (error) {
    next(error);
  }
};
