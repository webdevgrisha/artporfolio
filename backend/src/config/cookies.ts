import type { CookieOptions } from "express";

import { isLocalRuntime } from "#config/env";

// Local runs use plain HTTP, where browsers reject Secure and __Host- cookies.
const secure = !isLocalRuntime;

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure,
} satisfies CookieOptions;

export const sessionCookie = {
  name: "admin_session",
  options: { ...baseCookieOptions, path: "/api" },
} as const;

export const csrfCookie = {
  name: secure ? "__Host-admin_csrf" : "admin_csrf",
  options: { ...baseCookieOptions, path: "/" },
} as const;
