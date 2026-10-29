import { setupServer } from "msw/node";

/** The API for the tests. Each test sets the handlers it needs with `server.use`. */
export const server = setupServer();

/**
 * Records the requests sent from now until the end of the test, as `METHOD /path`, e.g.
 * `DELETE /api/about/photo`.
 */
export function recordRequests(): string[] {
  const requests: string[] = [];

  server.events.on("request:start", ({ request }) => {
    requests.push(`${request.method} ${new URL(request.url).pathname}`);
  });

  return requests;
}
