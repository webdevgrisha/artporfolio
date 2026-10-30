import type { CookieOptions } from "express";

import { isLocalRuntime } from "#shared/config/env";

// Local runs use plain HTTP, where browsers reject Secure cookies.
const secure = !isLocalRuntime;

// Firebase Hosting passes the function no cookie but __session, so the session has this name.
// https://firebase.google.com/docs/hosting/manage-cache#using_cookies
export const sessionCookie = {
  name: "__session",
  options: { httpOnly: true, path: "/api", sameSite: "strict", secure },
} as const satisfies { name: string; options: CookieOptions };
