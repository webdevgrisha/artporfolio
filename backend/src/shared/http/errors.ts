import type { InvalidField } from "#shared/http/problem";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class BadRequestError extends HttpError {
  constructor(
    message = "Invalid request",
    readonly errors: InvalidField[] = [],
  ) {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Authentication required") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Access denied") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Route not found") {
    super(404, message);
  }
}

export class PayloadTooLargeError extends HttpError {
  constructor(message = "Request is too large") {
    super(413, message);
  }
}

export class UnsupportedMediaTypeError extends HttpError {
  constructor(message = "Unsupported request body format") {
    super(415, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "The request conflicts with the current state") {
    super(409, message);
  }
}

/** The resource has changed since the client read it: its If-Match no longer matches. */
export class PreconditionFailedError extends HttpError {
  constructor(message = "The resource has changed since it was read") {
    super(412, message);
  }
}

/** The body is well-formed, but refers to something that does not exist, such as an expired upload. */
export class UnprocessableContentError extends HttpError {
  constructor(message = "The request cannot be processed") {
    super(422, message);
  }
}

/** A change that must name the version it replaces, with If-Match, came without it. */
export class PreconditionRequiredError extends HttpError {
  constructor(message = "The request must be conditional") {
    super(428, message);
  }
}
