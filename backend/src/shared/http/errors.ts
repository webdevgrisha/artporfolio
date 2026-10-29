/** One invalid value of a request body; the pointer is a JSON Pointer to it, such as "#/alt". */
export interface InvalidField {
  detail: string;
  pointer: string;
}

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
