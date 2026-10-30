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

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "allows %s requests in a preflight",
    async (method) => {
      const response = await fetch(`${server.baseUrl}/api/contacts/photo`, {
        headers: { "Access-Control-Request-Method": method, Origin: "http://localhost:5173" },
        method: "OPTIONS",
      });

      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-methods")?.split(",")).toContain(method);
    },
  );

  it("rejects requests from an origin outside the allowlist", async () => {
    const response = await fetch(`${server.baseUrl}/api/health`, {
      headers: { Origin: "https://attacker.example" },
    });

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toMatch(/^application\/problem\+json/);
    await expect(response.json()).resolves.toEqual({
      type: "about:blank",
      title: "Forbidden",
      status: 403,
      detail: "Origin is not allowed",
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
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "Unexpected end of JSON input",
    });
  });

  it("returns a payload too large response for an oversized JSON body", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({ idToken: "x".repeat(200_000) }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      title: "Payload Too Large",
      status: 413,
    });
  });
});

describe("unknown routes", () => {
  it("returns a not found problem", async () => {
    const response = await fetch(`${server.baseUrl}/api/unknown`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      type: "about:blank",
      title: "Not Found",
      status: 404,
      detail: "Route not found",
    });
  });
});
