import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../support/adminSession.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const uploads = vi.hoisted(() => ({ saveUpload: vi.fn() }));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#shared/images/uploads", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...uploads,
}));

import { uploadsRouter } from "#modules/uploads/routes";
import { UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const uploadId = "11111111-1111-4111-8111-111111111111";

let server: TestServer;

function uploadForm(fields: Record<string, string> = {}): FormData {
  const form = new FormData();

  for (const [name, value] of Object.entries(fields)) {
    form.append(name, value);
  }

  form.append("file", new Blob(["image"]), "sketch.png");
  return form;
}

function sendUpload(headers: Record<string, string>, body: FormData | string) {
  return fetch(`${server.baseUrl}/api/uploads`, { body, headers, method: "POST" });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/uploads", uploadsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  uploads.saveUpload.mockResolvedValue(uploadId);
});

afterAll(() => server.close());

describe("upload routes", () => {
  it("keeps the photo and returns the id to use it by", async () => {
    const response = await sendUpload(await adminHeaders(server.baseUrl), uploadForm());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ upload: { id: uploadId } });
    expect(uploads.saveUpload).toHaveBeenCalledWith({
      data: Buffer.from("image"),
      name: "sketch.png",
      size: 5,
    });
  });

  it("rejects other form fields", async () => {
    const response = await sendUpload(
      await adminHeaders(server.baseUrl),
      uploadForm({ alt: "Sketch" }),
    );

    expect(response.status).toBe(400);
    expect(uploads.saveUpload).not.toHaveBeenCalled();
  });

  it("requires a multipart body", async () => {
    const response = await sendUpload(
      { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      "{}",
    );

    expect(response.status).toBe(415);
  });

  it("rejects an upload without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await sendUpload(headers, uploadForm());

    expect(response.status).toBe(401);
    expect(uploads.saveUpload).not.toHaveBeenCalled();
  });

  it("rejects an upload without a CSRF token", async () => {
    const response = await sendUpload({ Cookie: adminSessionCookie }, uploadForm());

    expect(response.status).toBe(403);
    expect(uploads.saveUpload).not.toHaveBeenCalled();
  });
});
