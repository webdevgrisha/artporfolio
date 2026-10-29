import { describe, expect, it } from "vitest";

import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";
import { queryClient } from "@/shared/api/queryClient";

function shouldRetry(failureCount: number, error: Error): boolean {
  const { retry } = queryClient.getDefaultOptions().queries ?? {};
  if (typeof retry !== "function") throw new Error("Expected a retry function");

  return Boolean(retry(failureCount, error));
}

describe("queryClient", () => {
  it.each([400, 401, 404])("does not retry a query that failed with %d", (status) => {
    expect(shouldRetry(0, new HttpError(status))).toBe(false);
  });

  it.each([
    ["a server error", new HttpError(503)],
    ["a lost connection", new NetworkError(new TypeError())],
  ])("retries %s twice", (_name, error) => {
    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(true);
    expect(shouldRetry(2, error)).toBe(false);
  });
});
