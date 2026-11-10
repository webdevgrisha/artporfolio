/** A request to the API that brought no data the page can use. */
export class ApiError extends Error {
  /** The status of the answer; undefined when none came, as when the API could not be reached. */
  readonly status: number | undefined;

  constructor(message: string, status?: number, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Whether the API answered that what the page shows does not exist: the page is then a 404. */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
