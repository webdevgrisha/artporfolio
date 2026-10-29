import { afterEach, expect } from "vitest";

import { contractViolations } from "./contract.ts";

afterEach(() => {
  expect(contractViolations.splice(0), "responses that break openapi.yaml").toEqual([]);
});
