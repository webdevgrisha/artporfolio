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
  getPageHero: vi.fn(),
  getPages: vi.fn(),
  savePageHero: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/pages/service", () => pageService);

import { pagesRouter } from "#modules/pages/routes";
import { PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";

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
const etag = '"read"';
const savedEtag = '"saved"';

function sendHero(method: string, page: string, headers: Record<string, string>, body?: unknown) {
  return fetch(`${server.baseUrl}/api/pages/${page}/hero`, {
    body: body === undefined ? null : JSON.stringify(body),
    headers,
    method,
  });
}

async function jsonHeaders(): Promise<Record<string, string>> {
  return { ...(await ifMatchHeaders()), "Content-Type": "application/json" };
}

/** The headers of a signed-in admin with the ETag of the hero they read. */
async function ifMatchHeaders(): Promise<Record<string, string>> {
  return { ...(await adminHeaders(server.baseUrl)), "If-Match": etag };
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/pages", pagesRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  pageService.deletePageHero.mockResolvedValue(savedEtag);
  pageService.getPages.mockResolvedValue(pages);
  pageService.getPageHero.mockResolvedValue({ data: hero, etag });
  pageService.savePageHero.mockResolvedValue({ created: false, data: hero, etag: savedEtag });
});

afterAll(() => server.close());

describe("page routes", () => {
  it("returns the pages to every visitor", async () => {
    const response = await fetch(`${server.baseUrl}/api/pages`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ pages });
  });

  it("returns the hero of one page to every visitor, with its ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/pages/about/hero`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ hero });
    expect(pageService.getPageHero).toHaveBeenCalledWith("about");
  });

  it("returns 404 for the hero of an unknown page", async () => {
    const response = await fetch(`${server.baseUrl}/api/pages/contact/hero`);

    expect(response.status).toBe(404);
  });

  it.each(["PUT", "DELETE"])("requires the ETag of the hero for %s", async (method) => {
    const response = await sendHero(
      method,
      "about",
      { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      method === "PUT" ? { uploadId } : undefined,
    );

    expect(response.status).toBe(428);
  });

  it("refuses a hero changed since it was read", async () => {
    pageService.deletePageHero.mockRejectedValue(new PreconditionFailedError());

    const response = await sendHero("DELETE", "about", await ifMatchHeaders());

    expect(response.status).toBe(412);
  });

  it("returns 201 when the upload creates the first hero of a page", async () => {
    pageService.savePageHero.mockResolvedValue({ created: true, data: hero, etag: savedEtag });

    const response = await sendHero("PUT", "about", await jsonHeaders(), { uploadId });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ hero });
  });

  it("replaces the hero of a page with the upload", async () => {
    const response = await sendHero("PUT", "about", await jsonHeaders(), { uploadId });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ hero });
    expect(response.headers.get("ETag")).toBe(savedEtag);
    expect(pageService.savePageHero).toHaveBeenCalledWith("about", uploadId, etag);
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
    const response = await sendHero("DELETE", "about", await ifMatchHeaders());

    expect(response.status).toBe(204);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    expect(pageService.deletePageHero).toHaveBeenCalledWith("about", etag);
  });

  it("returns 404 when deleting the hero of an unknown page", async () => {
    const response = await sendHero("DELETE", "contact", await adminHeaders(server.baseUrl));

    expect(response.status).toBe(404);
    expect(pageService.deletePageHero).not.toHaveBeenCalled();
  });
});
