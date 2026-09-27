import type { CookieOptions, Request, Response } from "express";

import { authCookieNames, getAuthConfig } from "#config/authConfig";
import { csrfCookieName, csrfCookieOptions } from "#config/csrfConfig";

function baseCookieOptions(): CookieOptions {
  return {
    sameSite: "strict",
    secure: getAuthConfig().cookieSecure,
  };
}

export function readCookie(request: Request, name: string): string | undefined {
  const value = request.cookies?.[name];
  return typeof value === "string" ? value : undefined;
}

export function setSessionCookie(response: Response, sessionCookie: string): void {
  response.cookie(authCookieNames.session, sessionCookie, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: getAuthConfig().sessionTtlMilliseconds,
    path: "/api",
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(authCookieNames.session, {
    ...baseCookieOptions(),
    httpOnly: true,
    path: "/api",
  });
}

export function clearCsrfCookie(response: Response): void {
  response.clearCookie(csrfCookieName, csrfCookieOptions);
}
