import express, { type RequestHandler } from "express";

import { UnsupportedMediaTypeError } from "#shared/http/errors";

/** Parses a JSON body into request.body. */
export const parseJsonBody = express.json();

/** Rejects a body in any other format with 415, before anything reads it. */
export function requireContentType(type: string): RequestHandler {
  return (request, _response, next) => {
    next(request.is(type) ? undefined : new UnsupportedMediaTypeError(`Expected a ${type} body`));
  };
}
