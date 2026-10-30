import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../../support/adminSession.js";
import { apiImage } from "../../../support/images.js";
import { routeApp } from "../../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const photoService = vi.hoisted(() => ({
  deleteContactPhoto: vi.fn(),
  saveContactPhoto: vi.fn(),
  updateContactPhotoAlt: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/contacts/photo/service", () => photoService);

import { photoRouter } from "#modules/contacts/photo/routes";
import { NotFoundError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const photo = { ...apiImage("photo.png"), alt: "Portrait" };
const uploadId = "11111111-1111-4111-8111-111111111111";

let server: TestServer;

function sendPhoto(method: string, headers: Record<string, string>, body?: unknown) {
  return fetch(`${server.baseUrl}/api/contacts/photo`, {
    body: body === undefined ? null : JSON.stringify(body),
    headers,
    method,
  });
}

async function jsonHeaders(): Promise<Record<string, string>> {
  return { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" };
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/contacts/photo", photoRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  photoService.deleteContactPhoto.mockResolvedValue(undefined);
  photoService.saveContactPhoto.mockResolvedValue({ created: false, photo });
  photoService.updateContactPhotoAlt.mockResolvedValue(photo);
});

afterAll(() => server.close());

describe("contact photo routes", () => {
  it("returns 201 when the upload creates the photo", async () => {
    photoService.saveContactPhoto.mockResolvedValue({ created: true, photo });

    const response = await sendPhoto("PUT", await jsonHeaders(), { alt: "Portrait", uploadId });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ photo });
  });

  it("replaces the photo with the upload and its trimmed alt text", async () => {
    const response = await sendPhoto("PUT", await jsonHeaders(), {
      alt: "  Portrait  ",
      uploadId,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ photo });
    expect(photoService.saveContactPhoto).toHaveBeenCalledWith({ alt: "Portrait", uploadId });
  });

  it.each([
    ["alt text", { alt: " ", uploadId }],
    ["an upload", { alt: "Portrait" }],
  ])("requires %s with the photo", async (_field, body) => {
    const response = await sendPhoto("PUT", await jsonHeaders(), body);

    expect(response.status).toBe(400);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("takes a JSON body, not the file itself", async () => {
    const form = new FormData();
    form.append("file", new Blob(["image"]), "photo.png");

    const response = await fetch(`${server.baseUrl}/api/contacts/photo`, {
      body: form,
      headers: await adminHeaders(server.baseUrl),
      method: "PUT",
    });

    expect(response.status).toBe(415);
  });

  it("rejects a change without a session", async () => {
    const headers = await jsonHeaders();
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await sendPhoto("PUT", headers, { alt: "Portrait", uploadId });

    expect(response.status).toBe(401);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("rejects a change without a CSRF token", async () => {
    const response = await sendPhoto(
      "PUT",
      { Cookie: adminSessionCookie, "Content-Type": "application/json" },
      { alt: "Portrait", uploadId },
    );

    expect(response.status).toBe(403);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("updates the alt text", async () => {
    const response = await sendPhoto("PATCH", await jsonHeaders(), { alt: "New alt" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ photo });
    expect(photoService.updateContactPhotoAlt).toHaveBeenCalledWith("New alt");
  });

  it("returns 404 when updating the alt text without a photo", async () => {
    photoService.updateContactPhotoAlt.mockRejectedValue(new NotFoundError("There is no photo"));

    const response = await sendPhoto("PATCH", await jsonHeaders(), { alt: "New alt" });

    expect(response.status).toBe(404);
  });

  it("deletes the photo", async () => {
    const response = await sendPhoto("DELETE", await adminHeaders(server.baseUrl));

    expect(response.status).toBe(204);
    expect(photoService.deleteContactPhoto).toHaveBeenCalled();
  });
});
