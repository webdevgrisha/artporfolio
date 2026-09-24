import type { ErrorRequestHandler } from "express";
import { error as logError } from "firebase-functions/logger";

import { HttpError } from "#errors/httpError";

interface JsonSyntaxError extends SyntaxError {
  status: 400;
  type: "entity.parse.failed";
}

function isJsonSyntaxError(error: unknown): error is JsonSyntaxError {
  return (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400 &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (isJsonSyntaxError(error)) {
    response.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid JSON body",
      },
    });
    return;
  }

  logError("Unhandled request error", error);

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    },
  });
};
