import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";

import { loginBodySchema, userResponseSchema } from "#modules/auth/schema";
import { sessionCookie } from "#shared/config/cookies";
import { csrfTokenResponseSchema } from "#shared/middleware/csrf";
import {
  badRequestResponse,
  forbiddenResponse,
  jsonResponse,
  noContentResponse,
  payloadTooLargeResponse,
  problemResponse,
  unauthorizedResponse,
  unsupportedMediaTypeResponse,
} from "#shared/openapi/responses";
import { csrfSecurity, publicSecurity, sessionSecurity } from "#shared/openapi/security";

function setCookieHeader(description: string) {
  return z.object({ "Set-Cookie": z.string().meta({ description }) });
}

export const authPaths = {
  "/api/auth/csrf": {
    get: {
      operationId: "issueCsrfToken",
      tags: ["Auth"],
      summary: "Issue a CSRF token",
      description: "Every request that changes data needs the token in the `X-CSRF-Token` header.",
      security: publicSecurity,
      responses: {
        200: {
          ...jsonResponse("A new token.", csrfTokenResponseSchema),
          headers: setCookieHeader("Sets the CSRF cookie that matches the token."),
        },
        403: forbiddenResponse,
      },
    },
  },
  "/api/auth/login": {
    post: {
      operationId: "login",
      tags: ["Auth"],
      summary: "Start an admin session",
      description: "Exchanges a Firebase ID token for an admin session cookie.",
      security: csrfSecurity,
      requestBody: { content: { "application/json": { schema: loginBodySchema } } },
      responses: {
        200: {
          ...jsonResponse("Signed in.", userResponseSchema),
          headers: setCookieHeader(`Sets the httpOnly \`${sessionCookie.name}\` cookie.`),
        },
        400: badRequestResponse,
        401: problemResponse("Not the admin, or the password was entered more than 5 minutes ago."),
        403: forbiddenResponse,
        413: payloadTooLargeResponse,
        415: unsupportedMediaTypeResponse,
      },
    },
  },
  "/api/auth/me": {
    get: {
      operationId: "getCurrentUser",
      tags: ["Auth"],
      summary: "Get the signed-in admin",
      security: sessionSecurity,
      responses: {
        200: jsonResponse("The signed-in admin.", userResponseSchema),
        401: unauthorizedResponse,
        403: forbiddenResponse,
      },
    },
  },
  "/api/auth/logout": {
    post: {
      operationId: "logout",
      tags: ["Auth"],
      summary: "End the admin session",
      description:
        "Clears the session cookies and revokes the session. Succeeds without a session.",
      security: csrfSecurity,
      responses: {
        204: noContentResponse,
        403: forbiddenResponse,
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
