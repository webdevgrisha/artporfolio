import { describe, expect, it } from "vitest";

import {
  getRequestErrorMessage,
  isSessionExpiredError,
  networkErrorMessage,
} from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";

describe("isSessionExpiredError", () => {
  it.each([401, 403])("is true for %d", (status) => {
    expect(isSessionExpiredError(new HttpError(status))).toBe(true);
  });

  it.each([
    ["400", new HttpError(400)],
    ["500", new HttpError(500)],
    ["a network error", new NetworkError(new TypeError("Failed to fetch"))],
  ])("is false for %s", (_name, error) => {
    expect(isSessionExpiredError(error)).toBe(false);
  });
});

describe("getRequestErrorMessage", () => {
  it.each([500, 503])("says the service is unavailable for %d", (status) => {
    expect(getRequestErrorMessage(new HttpError(status), "fallback")).toBe(
      "Сервис временно недоступен. Попробуйте позже",
    );
  });

  it("says there is no connection for a request without a response", () => {
    expect(getRequestErrorMessage(new NetworkError(new TypeError()), "fallback")).toBe(
      networkErrorMessage,
    );
  });

  it.each([
    ["a client error", new HttpError(400)],
    // A bug in the code is not a lost connection.
    ["a TypeError", new TypeError("x is undefined")],
  ])("returns the fallback for %s", (_name, error) => {
    expect(getRequestErrorMessage(error, "fallback")).toBe("fallback");
  });
});
