import cookieParser from "cookie-parser";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);

import { authRouter } from "#modules/auth/routes";
import { UnauthorizedError } from "#shared/http/errors";
import { errorHandler } from "#shared/middleware/error";

const admin = { email: "admin@example.com", uid: "admin-uid" };

let server: TestServer;

const jsonHeaders = { "Content-Type": "application/json" };

async function getCsrfToken(sessionCookie: string) {
  const response = await fetch(`${server.baseUrl}/api/auth/csrf`, {
    headers: { Cookie: `__session=${sessionCookie}` },
  });
  const { csrfToken } = (await response.json()) as { csrfToken: string };

  return csrfToken;
}

function logout(headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/auth/logout`, { headers, method: "POST" });
}

beforeAll(async () => {
  const testApp = express();

  testApp.use(cookieParser());
  testApp.use(express.json());
  testApp.use("/api/auth", authRouter);
  testApp.use(errorHandler);

  server = await startTestServer(testApp);
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.createSession.mockResolvedValue({ sessionCookie: "firebase-session", user: admin });
  auth.revokeSession.mockResolvedValue(undefined);
  auth.verifySession.mockResolvedValue(admin);
});

afterAll(() => server.close());

describe("auth routes", () => {
  it("issues a CSRF token of the session that is not cached", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/csrf`, {
      headers: { Cookie: "__session=firebase-session" },
    });
    const { csrfToken } = (await response.json()) as { csrfToken: string };

    expect(response.status).toBe(200);
    expect(csrfToken.length).toBeGreaterThan(32);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("issues the same CSRF token to every tab of a session and another to a new session", async () => {
    const firstTab = await getCsrfToken("firebase-session");
    const secondTab = await getCsrfToken("firebase-session");
    const newSession = await getCsrfToken("new-firebase-session");

    expect(secondTab).toBe(firstTab);
    expect(newSession).not.toBe(firstTab);
  });

  it("issues no CSRF token without a session", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/csrf`);

    expect(response.status).toBe(401);
  });

  it("exchanges an ID token for an httpOnly session cookie", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({ idToken: "firebase-id-token" }),
      headers: jsonHeaders,
      method: "POST",
    });
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: admin });
    expect(auth.createSession).toHaveBeenCalledWith("firebase-id-token");
    expect(setCookie).toContain("__session=firebase-session");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/api");
    expect(setCookie).toContain("SameSite=Strict");
  });

  it("rejects a login that is not JSON, as a cross-site form sends", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: new URLSearchParams({ idToken: "firebase-id-token" }),
      method: "POST",
    });

    expect(response.status).toBe(415);
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("rejects login without an ID token", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({}),
      headers: jsonHeaders,
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("rejects login with an invalid request body", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({ idToken: 42 }),
      headers: jsonHeaders,
      method: "POST",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "Invalid request body",
      errors: [{ detail: "Invalid input: expected string, received number", pointer: "#/idToken" }],
    });
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("rejects unknown login fields", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({ idToken: "firebase-id-token", role: "admin" }),
      headers: jsonHeaders,
      method: "POST",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      errors: [{ detail: "Unknown field", pointer: "#/role" }],
    });
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("returns the authenticated admin", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/me`, {
      headers: { Cookie: "__session=firebase-session" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ user: admin });
    expect(auth.verifySession).toHaveBeenCalledWith("firebase-session");
  });

  it("rejects a missing session", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await fetch(`${server.baseUrl}/api/auth/me`);

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(auth.verifySession).toHaveBeenCalledWith(undefined);
  });

  it("revokes the session and clears its cookie", async () => {
    const response = await logout({
      Cookie: "__session=firebase-session",
      "X-CSRF-Token": await getCsrfToken("firebase-session"),
    });

    expect(response.status).toBe(204);
    expect(auth.revokeSession).toHaveBeenCalledWith("firebase-session");
    expect(response.headers.get("set-cookie")).toContain("__session=;");
  });

  it.each([
    ["no CSRF token", async () => undefined],
    ["the CSRF token of another session", () => getCsrfToken("old-firebase-session")],
  ])("rejects a logout with %s", async (_case, csrfToken) => {
    const token = await csrfToken();
    const response = await logout({
      Cookie: "__session=firebase-session",
      ...(token ? { "X-CSRF-Token": token } : {}),
    });

    expect(response.status).toBe(403);
    expect(auth.revokeSession).not.toHaveBeenCalled();
  });

  it("accepts a logout without a session", async () => {
    const response = await logout({});

    expect(response.status).toBe(204);
    expect(auth.revokeSession).toHaveBeenCalledWith(undefined);
  });
});
