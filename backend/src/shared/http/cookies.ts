import type { Request, Response } from "express";

import { sessionCookie } from "#shared/config/cookies";
import { getEnv } from "#shared/config/env";

export function readCookie(request: Pick<Request, "cookies">, name: string): string | undefined {
  const value = request.cookies?.[name];
  return typeof value === "string" ? value : undefined;
}

export function setSessionCookie(response: Response, value: string): void {
  response.cookie(sessionCookie.name, value, {
    ...sessionCookie.options,
    maxAge: getEnv().sessionTtlMilliseconds,
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(sessionCookie.name, sessionCookie.options);
}
