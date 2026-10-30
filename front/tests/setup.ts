import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { http } from "@/shared/api/http";

import { server } from "./support/server";

// A request without a handler fails its test instead of reaching the network.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
  // Each test starts without a session, as the HTTP client keeps the CSRF token between requests.
  http.forgetCsrfToken();
  // Testing Library unmounts on its own only where Vitest globals are enabled.
  cleanup();
});

afterAll(() => server.close());
