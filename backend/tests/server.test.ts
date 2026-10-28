import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { server as application } from "#server";
import { startTestServer, type TestServer } from "./support/testServer.js";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer(application);
});

afterAll(() => server.close());

describe("GET /api/health", () => {
  it("returns the API health status", async () => {
    const response = await fetch(`${server.baseUrl}/api/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.has("x-powered-by")).toBe(false);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});

describe("CORS", () => {
  it("allows credentialed requests from the configured origin", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
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
    const response = await fetch(`${server.baseUrl}/api/health`, {
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
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
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

describe("unknown routes", () => {
  it("returns a JSON not found response", async () => {
    const response = await fetch(`${server.baseUrl}/api/unknown`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    });
  });
});
