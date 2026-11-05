import type { CookieOptions, Request, Response } from "express";

import { getEnv, isLocalRuntime } from "#shared/config/env";

// Firebase Hosting passes the function no cookie but __session, so the session has this name.
// https://firebase.google.com/docs/hosting/manage-cache#using_cookies
const name = "__session";

const options: CookieOptions = {
  httpOnly: true,
  path: "/api",
  sameSite: "strict",
  // Local runs use plain HTTP, where browsers reject Secure cookies.
  secure: !isLocalRuntime,
};

export function readSessionCookie(request: Pick<Request, "cookies">): string | undefined {
  const value: unknown = request.cookies?.[name];

  return typeof value === "string" ? value : undefined;
}

export function setSessionCookie(response: Response, value: string): void {
  response.cookie(name, value, { ...options, maxAge: getEnv().sessionTtlMilliseconds });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(name, options);
}
