import type { RequestHandler } from "express";
import type { core, ZodType } from "zod";

import { BadRequestError, NotFoundError } from "#shared/http/errors";
import type { InvalidField } from "#shared/http/problem";

/** A JSON Pointer (RFC 6901) in URI fragment form, such as "#/contacts/0/url". */
function toPointer(path: readonly PropertyKey[]): string {
  const segments = path.map((segment) =>
    encodeURIComponent(String(segment).replaceAll("~", "~0").replaceAll("/", "~1")),
  );

  return `#${segments.map((segment) => `/${segment}`).join("")}`;
}

/** One entry per invalid value; an unknown field is reported at its own path. */
function toInvalidFields(issues: readonly core.$ZodIssue[]): InvalidField[] {
  return issues.flatMap((issue) =>
    issue.code === "unrecognized_keys"
      ? issue.keys.map((key) => ({
          detail: "Unknown field",
          pointer: toPointer([...issue.path, key]),
        }))
      : [{ detail: issue.message, pointer: toPointer(issue.path) }],
  );
}

export function validateBody(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(new BadRequestError("Invalid request body", toInvalidFields(result.error.issues)));
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

/**
 * Query parameters are checked like a body, each invalid one reported by name. A parameter the
 * schema does not know is left out rather than refused, as caches and trackers add their own.
 */
export function validateQuery(schema: ZodType<Record<string, unknown>>): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        detail: issue.message,
        parameter: String(issue.path[0]),
      }));

      next(new BadRequestError("Invalid query", errors));
      return;
    }

    // Express 5 parses `request.query` anew on every read, so the checked values replace the getter.
    Object.defineProperty(request, "query", { value: result.data });
    next();
  };
}
