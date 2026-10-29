import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./support/server";

// A request without a handler fails its test instead of reaching the network.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  server.resetHandlers();
  // Testing Library unmounts on its own only where Vitest globals are enabled.
  cleanup();
});

afterAll(() => server.close());
