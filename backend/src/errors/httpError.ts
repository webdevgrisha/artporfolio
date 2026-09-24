export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Invalid request") {
    super(400, "BAD_REQUEST", message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Access denied") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Route not found") {
    super(404, "NOT_FOUND", message);
  }
}
