import type { Server } from "node:http";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { server as application } from "#server";

let server: Server | undefined;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    const testServer = application.listen(0, "127.0.0.1");

    server = testServer;
    testServer.once("error", reject);
    testServer.once("listening", resolve);
  });

  const address = server?.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }

  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  const testServer = server;

  if (!testServer?.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    testServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("GET /api/health", () => {
  it("returns the API health status", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.has("x-powered-by")).toBe(false);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});

describe("CORS", () => {
  it("allows credentialed requests from the configured origin", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      headers: {
        "Access-Control-Request-Headers": "content-type,x-csrf-token",
        "Access-Control-Request-Method": "POST",
        Origin: "http://localhost:5173",
      },
      method: "OPTIONS",
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("rejects requests from an origin outside the allowlist", async () => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: "https://attacker.example" },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Origin is not allowed",
      },
    });
  });
});

describe("request body", () => {
  it("returns a bad request response for malformed JSON", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      body: '{"idToken":',
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid JSON body",
      },
    });
  });
});
