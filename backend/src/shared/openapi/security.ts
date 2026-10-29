import type { ZodOpenApiComponentsObject, ZodOpenApiOperationObject } from "zod-openapi";

import { sessionCookie } from "#shared/config/cookies";

type SecurityRequirements = NonNullable<ZodOpenApiOperationObject["security"]>;

export const securitySchemes = {
  session: {
    type: "apiKey",
    in: "cookie",
    name: sessionCookie.name,
    description: "The httpOnly admin session cookie set by `POST /api/auth/login`.",
  },
  csrf: {
    type: "apiKey",
    in: "header",
    name: "X-CSRF-Token",
    description:
      "A token from `GET /api/auth/csrf`, sent together with the CSRF cookie set by the same request (double-submit). The token is bound to the session, so request a new one after login.",
  },
} satisfies NonNullable<ZodOpenApiComponentsObject["securitySchemes"]>;

/** Anyone may call the operation: the public site reads it. */
export const publicSecurity: SecurityRequirements = [];

/** Reading admin data: a session is enough. */
export const sessionSecurity: SecurityRequirements = [{ session: [] }];

/** Changing data: a session and a CSRF token. */
export const adminSecurity: SecurityRequirements = [{ session: [], csrf: [] }];

/** A request that changes state before there is a session, such as login. */
export const csrfSecurity: SecurityRequirements = [{ csrf: [] }];
