import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { BadRequestError } from "#errors/httpError";

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
