import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../support/adminSession.js";
import { apiImage } from "../../support/images.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const pageService = vi.hoisted(() => ({
  deletePageHero: vi.fn(),
  getPages: vi.fn(),
  savePageHero: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/pages/service", () => pageService);

import { pagesRouter } from "#modules/pages/routes";
import { UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const hero = apiImage("painting.jpg");
const pages = {
  home: { hero: null },
  gallery: { hero: null },
  projects: { hero: null },
  about: { hero },
  contacts: { hero: null },
};

let server: TestServer;

const uploadId = "11111111-1111-4111-8111-111111111111";

function sendHero(method: string, page: string, headers: Record<string, string>, body?: unknown) {
  return fetch(`${server.baseUrl}/api/pages/${page}/hero`, {
    body: body === undefined ? null : JSON.stringify(body),
    headers,
    method,
  });
}

async function jsonHeaders(): Promise<Record<string, string>> {
  return { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" };
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/pages", pagesRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  pageService.deletePageHero.mockResolvedValue(undefined);
  pageService.getPages.mockResolvedValue(pages);
  pageService.savePageHero.mockResolvedValue({ created: false, hero });
});

afterAll(() => server.close());

describe("page routes", () => {
  it("returns the pages to every visitor", async () => {
    const response = await fetch(`${server.baseUrl}/api/pages`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ pages });
  });

  it("returns 201 when the upload creates the first hero of a page", async () => {
    pageService.savePageHero.mockResolvedValue({ created: true, hero });

    const response = await sendHero("PUT", "about", await jsonHeaders(), { uploadId });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ hero });
  });

  it("replaces the hero of a page with the upload", async () => {
    const response = await sendHero("PUT", "about", await jsonHeaders(), { uploadId });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ hero });
    expect(pageService.savePageHero).toHaveBeenCalledWith("about", uploadId);
  });

  it("rejects an unknown page", async () => {
    const response = await sendHero("PUT", "contact", await jsonHeaders(), { uploadId });

    expect(response.status).toBe(404);
    expect(pageService.savePageHero).not.toHaveBeenCalled();
  });

  it.each([
    ["without an upload", {}],
    ["with alt text, which a hero does not have", { alt: "Painting", uploadId }],
  ])("rejects a hero %s", async (_case, body) => {
    const response = await sendHero("PUT", "about", await jsonHeaders(), body);

    expect(response.status).toBe(400);
    expect(pageService.savePageHero).not.toHaveBeenCalled();
  });

  it("rejects a change without a session", async () => {
    const headers = await jsonHeaders();
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await sendHero("PUT", "about", headers, { uploadId });

    expect(response.status).toBe(401);
    expect(pageService.savePageHero).not.toHaveBeenCalled();
  });

  it("rejects a change without a CSRF token", async () => {
    const response = await sendHero(
      "PUT",
      "about",
      { Cookie: adminSessionCookie, "Content-Type": "application/json" },
      { uploadId },
    );

    expect(response.status).toBe(403);
    expect(pageService.savePageHero).not.toHaveBeenCalled();
  });

  it("deletes the hero of a page", async () => {
    const response = await sendHero("DELETE", "about", await adminHeaders(server.baseUrl));

    expect(response.status).toBe(204);
    expect(pageService.deletePageHero).toHaveBeenCalledWith("about");
  });

  it("returns 404 when deleting the hero of an unknown page", async () => {
    const response = await sendHero("DELETE", "contact", await adminHeaders(server.baseUrl));

    expect(response.status).toBe(404);
    expect(pageService.deletePageHero).not.toHaveBeenCalled();
  });
});
