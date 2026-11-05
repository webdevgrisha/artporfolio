import { Readable } from "node:stream";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminSessionCookie } from "../../support/adminSession.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const storage = vi.hoisted(() => ({ openFile: vi.fn() }));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#shared/firebase/storage", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...storage,
}));

import { originalsRouter } from "#modules/originals/routes";
import { UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const originalPath = "galleryWorks/work-id/photo/version-id/original.jpeg";

let server: TestServer;

function download(path: string, headers: Record<string, string> = { Cookie: adminSessionCookie }) {
  return fetch(`${server.baseUrl}/api/originals/${path}`, { headers });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/originals", originalsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  storage.openFile.mockImplementation(async () => ({
    contentDisposition:
      "attachment; filename*=UTF-8''%D1%81%D1%82%D1%80%D0%B5%D0%BA%D0%BE%D0%B7%D0%B0.jpg",
    contentType: "image/jpeg",
    size: 8,
    stream: Readable.from([Buffer.from("original")]),
  }));
});

afterAll(() => server.close());

describe("original routes", () => {
  it("sends the original as a download under the uploaded name, kept out of caches", async () => {
    const response = await download(originalPath);

    expect(response.status).toBe(200);
    expect(storage.openFile).toHaveBeenCalledWith(originalPath);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Content-Length")).toBe("8");
    expect(response.headers.get("Content-Disposition")).toBe(
      "attachment; filename*=UTF-8''%D1%81%D1%82%D1%80%D0%B5%D0%BA%D0%BE%D0%B7%D0%B0.jpg",
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.text()).resolves.toBe("original");
  });

  it("returns 404 when there is no such original", async () => {
    storage.openFile.mockResolvedValue(undefined);

    const response = await download(originalPath);

    expect(response.status).toBe(404);
  });

  it.each([
    ["a web image", "galleryWorks/work-id/photo/version-id/960.avif"],
    ["an upload manifest", "uploads/upload-id/upload.json"],
    ["a path out of its folder", "galleryWorks/%2E%2E/original.jpeg"],
    ["an original outside a folder", "original.jpeg"],
  ])("returns 404 for %s, without reading the bucket", async (_case, path) => {
    const response = await download(path);

    expect(response.status).toBe(404);
    expect(storage.openFile).not.toHaveBeenCalled();
  });

  it("rejects a request without a session", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await download(originalPath, {});

    expect(response.status).toBe(401);
    expect(storage.openFile).not.toHaveBeenCalled();
  });
});
