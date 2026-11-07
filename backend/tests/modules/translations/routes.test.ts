import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ verifySession: vi.fn() }));
const store = vi.hoisted(() => ({
  editTranslations: vi.fn(),
  getTranslationStatus: vi.fn(),
  getTranslations: vi.fn(),
  retryTranslations: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/translations/service", () => store);

import { translationsRouter } from "#modules/translations/routes";
import { UnauthorizedError } from "#shared/http/errors";

import { adminHeaders, adminSessionCookie } from "../../support/adminSession.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const translations = { failed: false, isTranslating: false, sources: {}, translations: {} };

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/translations", translationsRouter));
});

afterAll(() => server.close());

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  store.getTranslations.mockResolvedValue(translations);
  store.editTranslations.mockResolvedValue(translations);
  store.getTranslationStatus.mockResolvedValue({ halted: null, usage: null });
});

function read(path: string, headers: Record<string, string> = {}) {
  return fetch(`${server.baseUrl}/api/translations${path}`, { headers });
}

async function patch(path: string, body: unknown) {
  return fetch(`${server.baseUrl}/api/translations${path}`, {
    body: JSON.stringify(body),
    headers: { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
    method: "PATCH",
  });
}

describe("reading translations", () => {
  it("shows them to the admin and keeps them out of shared caches", async () => {
    const response = await read("/gallery-work-1", { Cookie: adminSessionCookie });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-cache");
    await expect(response.json()).resolves.toEqual(translations);
  });

  it("needs the admin: they hold the texts of hidden works", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await read("/gallery-work-1");

    expect(response.status).toBe(401);
    expect(store.getTranslations).not.toHaveBeenCalled();
  });

  it("needs the admin for the status of translating", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    expect((await read("/status")).status).toBe(401);
  });
});

describe("changing translations", () => {
  it("saves what a person changed in one language", async () => {
    const response = await patch("/gallery-work-1/en", {
      description: null,
      title: { source: "Слон", text: " Elephant " },
    });

    expect(response.status).toBe(200);
    expect(store.editTranslations).toHaveBeenCalledWith("gallery-work-1", "en", {
      description: null,
      title: { source: "Слон", text: "Elephant" },
    });
  });

  it("rejects an unknown language", async () => {
    const title = { source: "Слон", text: "Elephant" };

    expect((await patch("/gallery-work-1/xx", { title })).status).toBe(404);
  });

  it("rejects an empty text", async () => {
    const title = { source: "Слон", text: "  " };

    expect((await patch("/gallery-work-1/en", { title })).status).toBe(400);
  });

  it("rejects a text without the source it was written from", async () => {
    expect((await patch("/gallery-work-1/en", { title: "Elephant" })).status).toBe(400);
  });

  it("rejects a change of nothing", async () => {
    expect((await patch("/gallery-work-1/en", {})).status).toBe(400);
  });

  it("is the admin's alone", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await fetch(`${server.baseUrl}/api/translations/gallery-work-1/en`, {
      body: "{}",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    expect(response.status).toBe(401);
    expect(store.editTranslations).not.toHaveBeenCalled();
  });
});
