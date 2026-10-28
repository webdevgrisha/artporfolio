import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { BadRequestError, NotFoundError } from "#shared/http/errors";

export function validateBody(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(new BadRequestError("Invalid request body"));
      return;
    }

    request.body = result.data;
    next();
  };
}

/** Path parameters name a resource, so invalid ones name a resource that does not exist. */
export function validateParams(schema: ZodType<Record<string, string>>): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      next(new NotFoundError());
      return;
    }

    request.params = result.data;
    next();
  };
}
