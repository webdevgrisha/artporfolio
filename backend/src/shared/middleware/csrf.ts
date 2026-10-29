import type { RequestHandler } from "express";
import { z } from "zod";

import { doubleCsrfProtection, generateCsrfToken } from "#shared/config/csrf";
import { ForbiddenError } from "#shared/http/errors";

/** The client sends the token back in the X-CSRF-Token header of every change. */
export const csrfTokenResponseSchema = z.object({
  csrfToken: z.string(),
});

export type CsrfTokenResponse = z.infer<typeof csrfTokenResponseSchema>;

// csrf-csrf takes the request with the default path parameters type.
export const issueCsrfToken: RequestHandler<Record<string, string>, CsrfTokenResponse> = (
  request,
  response,
) => {
  const csrfToken = generateCsrfToken(request, response, { overwrite: true });

  response.status(200).json({ csrfToken });
};

export const requireCsrfToken: RequestHandler = (request, response, next) => {
  doubleCsrfProtection(request, response, (error) => {
    next(error ? new ForbiddenError("Invalid CSRF token") : undefined);
  });
};
