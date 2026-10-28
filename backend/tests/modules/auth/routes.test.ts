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

function csrfHeaders(
  csrfToken: string,
  csrfCookie: string,
  sessionCookie?: string,
): Record<string, string> {
  const cookies = [csrfCookie];

  if (sessionCookie) {
    cookies.push(`admin_session=${sessionCookie}`);
  }

  return {
    "Content-Type": "application/json",
    Cookie: cookies.join("; "),
    "X-CSRF-Token": csrfToken,
  };
}

async function getCsrf(sessionCookie?: string) {
  const options: RequestInit = sessionCookie
    ? { headers: { Cookie: `admin_session=${sessionCookie}` } }
    : {};
  const response = await fetch(`${server.baseUrl}/api/auth/csrf`, options);
  const body = (await response.json()) as { csrfToken: string };
  const csrfCookie = response.headers.get("set-cookie")?.split(";", 1)[0];

  if (!csrfCookie) {
    throw new Error("CSRF endpoint did not set a cookie");
  }

  return { csrfCookie, csrfToken: body.csrfToken, response };
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
  it("issues a CSRF token and matching cookie", async () => {
    const { csrfToken, response } = await getCsrf();
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    expect(csrfToken.length).toBeGreaterThan(32);
    expect(setCookie).toContain("admin_csrf=");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).toContain("HttpOnly");
  });

  it("exchanges an ID token for an httpOnly session cookie", async () => {
    const { csrfCookie, csrfToken } = await getCsrf();
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({ idToken: "firebase-id-token" }),
      headers: csrfHeaders(csrfToken, csrfCookie),
      method: "POST",
    });
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: admin });
    expect(auth.createSession).toHaveBeenCalledWith("firebase-id-token");
    expect(setCookie).toContain("admin_session=firebase-session");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/api");
    expect(setCookie).toContain("SameSite=Strict");
  });

  it("rejects login without a matching CSRF token", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({ idToken: "firebase-id-token" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(403);
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("rejects login without an ID token", async () => {
    const { csrfCookie, csrfToken } = await getCsrf();
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({}),
      headers: csrfHeaders(csrfToken, csrfCookie),
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("rejects login with an invalid request body", async () => {
    const { csrfCookie, csrfToken } = await getCsrf();
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({ idToken: 42 }),
      headers: csrfHeaders(csrfToken, csrfCookie),
      method: "POST",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid request body",
      },
    });
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("rejects unknown login fields", async () => {
    const { csrfCookie, csrfToken } = await getCsrf();
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      body: JSON.stringify({ idToken: "firebase-id-token", role: "admin" }),
      headers: csrfHeaders(csrfToken, csrfCookie),
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("returns the authenticated admin", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/me`, {
      headers: { Cookie: "admin_session=firebase-session" },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: admin });
    expect(auth.verifySession).toHaveBeenCalledWith("firebase-session");
  });

  it("rejects a missing session", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await fetch(`${server.baseUrl}/api/auth/me`);

    expect(response.status).toBe(401);
    expect(auth.verifySession).toHaveBeenCalledWith(undefined);
  });

  it("revokes the session and clears auth cookies", async () => {
    const { csrfCookie, csrfToken } = await getCsrf("firebase-session");
    const response = await fetch(`${server.baseUrl}/api/auth/logout`, {
      headers: csrfHeaders(csrfToken, csrfCookie, "firebase-session"),
      method: "POST",
    });
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(204);
    expect(auth.revokeSession).toHaveBeenCalledWith("firebase-session");
    expect(setCookie).toContain("admin_session=");
    expect(setCookie).toContain("admin_csrf=");
  });
});
