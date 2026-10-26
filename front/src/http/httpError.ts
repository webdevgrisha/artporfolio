export class HttpError extends Error {
  readonly code: string | undefined;
  readonly status: number;

  constructor(status: number, code?: string) {
    super(`Request failed with status ${String(status)}`);
    this.name = "HttpError";
    this.code = code;
    this.status = status;
  }
}
