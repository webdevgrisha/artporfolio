import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "#middleware/error.middleware";

describe("errorHandler", () => {
  it("does not expose unexpected error details", () => {
    const response = {
      json: vi.fn(),
      status: vi.fn(),
    } as unknown as Response;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.mocked(response.status).mockReturnValue(response);

    errorHandler(
      new Error("Sensitive provider details"),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(consoleError).toHaveBeenCalledOnce();
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ message: "Internal Server Error" });

    consoleError.mockRestore();
  });
});
