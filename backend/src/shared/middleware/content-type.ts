import express, { type RequestHandler } from "express";

import { UnsupportedMediaTypeError } from "#shared/http/errors";

/**
 * Parses a JSON body into request.body. Cloud Functions parses it first, with its own size limit,
 * and this then leaves it as it is; the limits of the schemas bound what is kept.
 */
export const parseJsonBody = express.json();

/** Rejects a body in any other format with 415. */
export function requireContentType(type: string): RequestHandler {
  return (request, _response, next) => {
    next(request.is(type) ? undefined : new UnsupportedMediaTypeError(`Expected a ${type} body`));
  };
}
