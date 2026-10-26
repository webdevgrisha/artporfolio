import type { RequestHandler } from "express";

import { doubleCsrfProtection, generateCsrfToken } from "#config/csrf";
import { ForbiddenError } from "#errors/httpError";

export const issueCsrfToken: RequestHandler = (request, response) => {
  const csrfToken = generateCsrfToken(request, response, { overwrite: true });

  response.status(200).json({ csrfToken });
};

export const requireCsrfToken: RequestHandler = (request, response, next) => {
  doubleCsrfProtection(request, response, (error) => {
    next(error ? new ForbiddenError("Invalid CSRF token") : undefined);
  });
};
