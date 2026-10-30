import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

const logger = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("firebase-functions/logger", () => logger);

import { errorHandler } from "#shared/middleware/error";

describe("errorHandler", () => {
  it("leaves a response that has already started to Express", () => {
    const response = { headersSent: true, status: vi.fn() } as unknown as Response;
    const next = vi.fn();
    const error = new Error("Failed while streaming");

    errorHandler(error, {} as Request, response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(error);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("does not expose unexpected error details", () => {
    const response = {
      json: vi.fn(),
      status: vi.fn(),
      type: vi.fn(),
    } as unknown as Response;
    vi.mocked(response.status).mockReturnValue(response);
    vi.mocked(response.type).mockReturnValue(response);

    errorHandler(
      new Error("Sensitive provider details"),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(logger.error).toHaveBeenCalledWith("Unhandled request error", expect.any(Error));
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.type).toHaveBeenCalledWith("application/problem+json");
    expect(response.json).toHaveBeenCalledWith({
      type: "about:blank",
      title: "Internal Server Error",
      status: 500,
    });
  });
});
