/** A request that never got a response: no connection, or the server could not be reached. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("Request failed without a response", { cause });
    this.name = "NetworkError";
  }
}
