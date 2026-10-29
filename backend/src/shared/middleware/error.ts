import { STATUS_CODES } from "node:http";

import type { ErrorRequestHandler, Response } from "express";
import { error as logError } from "firebase-functions/logger";

import { BadRequestError, HttpError, type InvalidField } from "#shared/http/errors";

/** An error response body as defined by RFC 9457, Problem Details for HTTP APIs. */
interface ProblemDetails {
  detail?: string;
  errors?: InvalidField[];
  status: number;
  title: string;
  /** "about:blank" means the status code says all there is: the title is its reason phrase. */
  type: "about:blank";
}

interface Problem {
  detail?: string;
  errors?: InvalidField[];
  status: number;
}

/**
 * A client error raised by Express or its body parsers, such as a malformed JSON body. They follow
 * the http-errors convention: `expose` marks a message that is safe to send to the client.
 */
interface ExposedError extends Error {
  expose: true;
  status: number;
}

function isExposedError(error: unknown): error is ExposedError {
  return (
    error instanceof Error &&
    "expose" in error &&
    error.expose === true &&
    "status" in error &&
    typeof error.status === "number"
  );
}

function sendProblem(response: Response, { detail, errors = [], status }: Problem): void {
  const body: ProblemDetails = {
    type: "about:blank",
    title: STATUS_CODES[status] ?? "Error",
    status,
  };

  if (detail) {
    body.detail = detail;
  }

  if (errors.length > 0) {
    body.errors = errors;
  }

  response.status(status).type("application/problem+json").json(body);
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    const errors = error instanceof BadRequestError ? error.errors : [];

    sendProblem(response, { detail: error.message, errors, status: error.status });
    return;
  }

  if (isExposedError(error)) {
    sendProblem(response, { detail: error.message, status: error.status });
    return;
  }

  logError("Unhandled request error", error);

  sendProblem(response, { status: 500 });
};
