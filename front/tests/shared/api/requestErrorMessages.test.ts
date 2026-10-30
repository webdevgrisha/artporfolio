import { describe, expect, it } from "vitest";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";
import {
  getRequestErrorMessage,
  getSaveErrorMessage,
  isSessionExpiredError,
  networkErrorMessage,
  sessionExpiredMessage,
} from "@/shared/api/requestErrorMessages";

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

describe("getSaveErrorMessage", () => {
  const messages = { byStatus: { 400: "rejected", 401: "unused" }, fallback: "fallback" };

  it.each([401, 403])(
    "says the session expired for %d, before the messages by status",
    (status) => {
      expect(getSaveErrorMessage(new HttpError(status), messages)).toBe(sessionExpiredMessage);
    },
  );

  it("returns the message for the status", () => {
    expect(getSaveErrorMessage(new HttpError(400), messages)).toBe("rejected");
  });

  it("returns the fallback for a status without a message", () => {
    expect(getSaveErrorMessage(new HttpError(404), messages)).toBe("fallback");
  });

  it("covers no connection and server errors as getRequestErrorMessage does", () => {
    expect(getSaveErrorMessage(new NetworkError(new TypeError()), messages)).toBe(
      networkErrorMessage,
    );
    expect(getSaveErrorMessage(new HttpError(503), messages)).toBe(
      "Сервис временно недоступен. Попробуйте позже",
    );
  });

  it("lets a status message take a server error", () => {
    expect(
      getSaveErrorMessage(new HttpError(503), { byStatus: { 503: "busy" }, fallback: "fallback" }),
    ).toBe("busy");
  });
});
