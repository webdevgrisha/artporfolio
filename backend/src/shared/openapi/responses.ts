import type { ZodType } from "zod";
import type { ZodOpenApiResponseObject } from "zod-openapi";

import { problemDetailsSchema } from "#shared/http/problem";

export function jsonResponse(description: string, schema: ZodType): ZodOpenApiResponseObject {
  return { description, content: { "application/json": { schema } } };
}

export const noContentResponse: ZodOpenApiResponseObject = { description: "Done, no body." };

/** An error response whose description is specific to one operation. */
export function problemResponse(description: string): ZodOpenApiResponseObject {
  return { description, content: { "application/problem+json": { schema: problemDetailsSchema } } };
}

/** A reusable error response: registered once under components/responses by its id. */
function sharedProblemResponse(id: string, description: string): ZodOpenApiResponseObject {
  return { ...problemResponse(description), id };
}

export const badRequestResponse = sharedProblemResponse(
  "BadRequest",
  "The request is invalid. For an invalid body, `errors` lists every invalid value.",
);
export const unauthorizedResponse = sharedProblemResponse(
  "Unauthorized",
  "There is no valid admin session.",
);
export const forbiddenResponse = sharedProblemResponse(
  "Forbidden",
  "The CSRF token is missing or invalid, or the origin is not allowed.",
);
export const notFoundResponse = sharedProblemResponse("NotFound", "The resource does not exist.");
export const conflictResponse = sharedProblemResponse(
  "Conflict",
  "The request conflicts with the current state of the resource.",
);
export const payloadTooLargeResponse = sharedProblemResponse(
  "PayloadTooLarge",
  "The request body or the uploaded file is too large.",
);
export const unsupportedMediaTypeResponse = sharedProblemResponse(
  "UnsupportedMediaType",
  "The body is in a format the endpoint does not take.",
);
