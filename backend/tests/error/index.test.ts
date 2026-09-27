import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

const logger = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("firebase-functions/logger", () => logger);

import { errorHandler } from "#middleware/error/index";

describe("errorHandler", () => {
  it("does not expose unexpected error details", () => {
    const response = {
      json: vi.fn(),
      status: vi.fn(),
    } as unknown as Response;
    vi.mocked(response.status).mockReturnValue(response);

    errorHandler(
      new Error("Sensitive provider details"),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(logger.error).toHaveBeenCalledWith("Unhandled request error", expect.any(Error));
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal Server Error",
      },
    });
  });
});
