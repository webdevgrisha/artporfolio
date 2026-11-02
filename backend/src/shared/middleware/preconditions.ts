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

/**
 * Whether the request may only create its resource: `If-None-Match: *` (RFC 9110 §13.1.2) fails
 * with 412 once the resource exists. A client that names the new resource itself sends it, so a
 * create repeated after a lost response cannot make a second one.
 */
export function isCreateOnly(request: Pick<Request, "get">): boolean {
  return request.get("If-None-Match")?.trim() === "*";
}

/**
 * Like requireIfMatch, for a PUT that may also create its resource: it needs If-Match, or
 * `If-None-Match: *` to create one that does not exist yet.
 */
export const requireIfMatchOrCreateOnly: RequestHandler = (request, _response, next) => {
  next(
    request.get("If-Match") || isCreateOnly(request)
      ? undefined
      : new PreconditionRequiredError(
          "Send the ETag of the resource in If-Match, or If-None-Match: * to create it",
        ),
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
