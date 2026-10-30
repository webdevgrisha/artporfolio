import type { Request, RequestHandler } from "express";

import { PreconditionRequiredError } from "#shared/http/errors";

/**
 * Rejects a change sent without If-Match with 428 (RFC 6585 §3): it would overwrite whatever the
 * server has, even a version the client has never seen.
 */
export const requireIfMatch: RequestHandler = (request, _response, next) => {
  next(
    request.get("If-Match")
      ? undefined
      : new PreconditionRequiredError("Send the ETag of the resource in If-Match"),
  );
};

/** The If-Match header checked by requireIfMatch, for handlers mounted after it. */
export function ifMatchHeader(request: Pick<Request, "get">): string {
  const header = request.get("If-Match");

  if (!header) {
    throw new Error("requireIfMatch must run before the handler that reads If-Match");
  }

  return header;
}
