import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../../support/adminSession.js";
import { routeApp } from "../../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const linksService = vi.hoisted(() => ({
  getContactLinks: vi.fn(),
  saveContactLinks: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/contacts/links/service", () => linksService);

import { linksRouter } from "#modules/contacts/links/routes";
import { UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };

const links = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

let server: TestServer;

function putLinks(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/contacts/links`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/contacts/links", linksRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  linksService.getContactLinks.mockResolvedValue(links);
  linksService.saveContactLinks.mockResolvedValue(undefined);
});

afterAll(() => server.close());

describe("contact links routes", () => {
  it("returns the links without a session", async () => {
    const response = await fetch(`${server.baseUrl}/api/contacts/links`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ links });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves trimmed links for the admin", async () => {
    const response = await putLinks(
      { ...links, linkedin: "  https://linkedin.com/in/artist  " },
      await adminHeaders(server.baseUrl),
    );
    const saved = { ...links, linkedin: "https://linkedin.com/in/artist" };

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ links: saved });
    expect(linksService.saveContactLinks).toHaveBeenCalledWith(saved);
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putLinks(links, headers);

    expect(response.status).toBe(401);
    expect(linksService.saveContactLinks).not.toHaveBeenCalled();
  });

  it("rejects saving without a CSRF token", async () => {
    const response = await putLinks(links, {
      "Content-Type": "application/json",
      Cookie: adminSessionCookie,
    });

    expect(response.status).toBe(403);
    expect(linksService.saveContactLinks).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await putLinks(links, {
      ...(await adminHeaders(server.baseUrl)),
      "Content-Type": "text/plain",
    });

    expect(response.status).toBe(415);
    expect(linksService.saveContactLinks).not.toHaveBeenCalled();
  });

  it("rejects invalid links", async () => {
    const response = await putLinks(
      { ...links, instagram: "javascript:alert(1)" },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    expect(linksService.saveContactLinks).not.toHaveBeenCalled();
  });
});
