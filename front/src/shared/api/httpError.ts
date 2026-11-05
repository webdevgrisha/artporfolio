export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${String(status)}`);
    this.name = "HttpError";
    this.status = status;
  }
}

/** The server refused a change: the resource has changed since it was read, or it already exists. */
export function isPreconditionFailed(error: unknown): boolean {
  return error instanceof HttpError && error.status === 412;
}
