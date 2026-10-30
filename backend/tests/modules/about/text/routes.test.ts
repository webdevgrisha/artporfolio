import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders } from "../../../support/adminSession.js";
import { routeApp } from "../../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const textService = vi.hoisted(() => ({
  getAboutText: vi.fn(),
  saveAboutText: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/about/text/service", () => textService);

import { aboutTextRouter } from "#modules/about/text/routes";
import { UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };

let server: TestServer;

function putText(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/about/text`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/about/text", aboutTextRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  textService.getAboutText.mockResolvedValue(text);
  textService.saveAboutText.mockResolvedValue(undefined);
});

afterAll(() => server.close());

describe("about text routes", () => {
  it("returns the texts to every visitor", async () => {
    const response = await fetch(`${server.baseUrl}/api/about/text`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ text });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves trimmed texts", async () => {
    const response = await putText(
      { ...text, about: "  Иллюстратор.  " },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ text });
    expect(textService.saveAboutText).toHaveBeenCalledWith(text);
  });

  it("reports every invalid text", async () => {
    const response = await putText(
      { about: "a".repeat(501), biography: "a".repeat(2_001), creation: "Пишет маслом." },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/about", "#/biography"]);
    expect(textService.saveAboutText).not.toHaveBeenCalled();
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putText(text, headers);

    expect(response.status).toBe(401);
    expect(textService.saveAboutText).not.toHaveBeenCalled();
  });

  it("rejects saving without a CSRF token", async () => {
    const { Cookie } = await adminHeaders(server.baseUrl);

    const response = await putText(text, { Cookie: String(Cookie) });

    expect(response.status).toBe(403);
    expect(textService.saveAboutText).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await putText(text, {
      ...(await adminHeaders(server.baseUrl)),
      "Content-Type": "text/plain",
    });

    expect(response.status).toBe(415);
  });
});
