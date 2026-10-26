export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${String(status)}`);
    this.name = "HttpError";
    this.status = status;
  }
}
