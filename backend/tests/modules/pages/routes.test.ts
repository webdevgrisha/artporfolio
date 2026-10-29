import cookieParser from "cookie-parser";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../support/adminSession.js";
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

import { authRouter } from "#modules/auth/routes";
import { pagesRouter } from "#modules/pages/routes";
import { UnauthorizedError } from "#shared/http/errors";
import { errorHandler } from "#shared/middleware/error";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const hero = { fileName: "painting.jpg", version: "version" };
const pages = { about: { hero }, home: { hero: null } };

let server: TestServer;

function heroForm(fields: { alt?: string; file?: Blob }): FormData {
  const form = new FormData();

  if (fields.alt !== undefined) {
    form.append("alt", fields.alt);
  }

  if (fields.file) {
    form.append("file", fields.file, "painting.jpg");
  }

  return form;
}

function sendHero(
  method: string,
  page: string,
  headers: Record<string, string>,
  body?: FormData | string,
) {
  return fetch(`${server.baseUrl}/api/pages/${page}/hero`, { body: body ?? null, headers, method });
}

beforeAll(async () => {
  const testApp = express();

  testApp.use(cookieParser());
  testApp.use(express.json());
  testApp.use("/api/auth", authRouter);
  testApp.use("/api/pages", pagesRouter);
  testApp.use(errorHandler);

  server = await startTestServer(testApp);
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

    const response = await sendHero(
      "PUT",
      "about",
      await adminHeaders(server.baseUrl),
      heroForm({ file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ hero });
  });

  it("replaces the hero of a page", async () => {
    const response = await sendHero(
      "PUT",
      "about",
      await adminHeaders(server.baseUrl),
      heroForm({ file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ hero });
    expect(pageService.savePageHero).toHaveBeenCalledWith("about", {
      data: Buffer.from("image"),
      name: "painting.jpg",
      size: 5,
    });
  });

  it("rejects an unknown page before reading the body", async () => {
    // Not a multipart body: reading it would fail with 400, so 404 means it was never read.
    const response = await sendHero(
      "PUT",
      "contact",
      { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      "{}",
    );

    expect(response.status).toBe(404);
    expect(pageService.savePageHero).not.toHaveBeenCalled();
  });

  it("rejects text fields sent with the hero", async () => {
    const response = await sendHero(
      "PUT",
      "about",
      await adminHeaders(server.baseUrl),
      heroForm({ alt: "Painting", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(400);
    expect(pageService.savePageHero).not.toHaveBeenCalled();
  });

  it("requires a file", async () => {
    const response = await sendHero(
      "PUT",
      "about",
      await adminHeaders(server.baseUrl),
      heroForm({}),
    );

    expect(response.status).toBe(400);
    expect(pageService.savePageHero).not.toHaveBeenCalled();
  });

  it("rejects an upload without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await sendHero(
      "PUT",
      "about",
      headers,
      heroForm({ file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(401);
    expect(pageService.savePageHero).not.toHaveBeenCalled();
  });

  it("rejects an upload without a CSRF token", async () => {
    const response = await sendHero(
      "PUT",
      "about",
      { Cookie: adminSessionCookie },
      heroForm({ file: new Blob(["image"]) }),
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
