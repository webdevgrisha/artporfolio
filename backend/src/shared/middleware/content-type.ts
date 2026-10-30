import express, { type RequestHandler } from "express";

import { UnsupportedMediaTypeError } from "#shared/http/errors";

/** A JSON Merge Patch (RFC 7396), the body of a PATCH: the fields it sends replace those of the resource. */
export const mergePatchType = "application/merge-patch+json";

/** Parses a JSON body, a merge patch included, into request.body. */
export const parseJsonBody = express.json({ type: ["application/json", mergePatchType] });

/** Rejects a body in any other format with 415, before anything reads it. */
export function requireContentType(type: string): RequestHandler {
  return (request, _response, next) => {
    next(request.is(type) ? undefined : new UnsupportedMediaTypeError(`Expected a ${type} body`));
  };
}
