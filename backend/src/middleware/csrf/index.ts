import type { RequestHandler } from "express";

import { doubleCsrfProtection, generateCsrfToken } from "#config/csrfConfig";
import { ForbiddenError } from "#errors/httpError";

export const issueCsrfToken: RequestHandler = (request, response, next) => {
  try {
    const csrfToken = generateCsrfToken(request, response, { overwrite: true });

    response.status(200).json({ csrfToken });
  } catch (error) {
    next(error);
  }
};

export const requireCsrfToken: RequestHandler = (request, response, next) => {
  doubleCsrfProtection(request, response, (error) => {
    next(error ? new ForbiddenError("Invalid CSRF token") : undefined);
  });
};
