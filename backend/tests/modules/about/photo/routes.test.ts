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
  deleteAboutPhoto: vi.fn(),
  getAboutPhoto: vi.fn(),
  saveAboutPhoto: vi.fn(),
  updateAboutPhotoAlt: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/about/photo/service", () => photoService);

import { aboutPhotoRouter } from "#modules/about/photo/routes";
import { NotFoundError, PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const photo = { ...apiImage("photo.png"), alt: "Portrait" };
const uploadId = "11111111-1111-4111-8111-111111111111";
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function sendPhoto(method: string, headers: Record<string, string>, body?: unknown) {
  return fetch(`${server.baseUrl}/api/about/photo`, {
    body: body === undefined ? null : JSON.stringify(body),
    headers,
    method,
  });
}

async function jsonHeaders(): Promise<Record<string, string>> {
  return { ...(await ifMatchHeaders()), "Content-Type": "application/json" };
}

async function mergePatchHeaders(): Promise<Record<string, string>> {
  return { ...(await ifMatchHeaders()), "Content-Type": "application/merge-patch+json" };
}

/** The headers of a signed-in admin with the ETag of the photo they read. */
async function ifMatchHeaders(): Promise<Record<string, string>> {
  return { ...(await adminHeaders(server.baseUrl)), "If-Match": etag };
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/about/photo", aboutPhotoRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  photoService.deleteAboutPhoto.mockResolvedValue(undefined);
  photoService.getAboutPhoto.mockResolvedValue({ data: photo, etag });
  photoService.saveAboutPhoto.mockResolvedValue({ created: false, data: photo, etag: savedEtag });
  photoService.updateAboutPhotoAlt.mockResolvedValue({ data: photo, etag: savedEtag });
});

afterAll(() => server.close());

describe("about photo routes", () => {
  it("returns the photo to every visitor, with its ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/about/photo`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ photo });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("returns null before a photo is uploaded", async () => {
    photoService.getAboutPhoto.mockResolvedValue({ data: null, etag });

    const response = await fetch(`${server.baseUrl}/api/about/photo`);

    await expect(response.json()).resolves.toEqual({ photo: null });
  });

  it("returns 201 when the upload creates the photo", async () => {
    photoService.saveAboutPhoto.mockResolvedValue({ created: true, data: photo, etag: savedEtag });

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
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ photo });
    expect(photoService.saveAboutPhoto).toHaveBeenCalledWith({ alt: "Portrait", uploadId }, etag);
  });

  it.each(["PUT", "PATCH", "DELETE"])("requires the ETag of the photo for %s", async (method) => {
    const response = await sendPhoto(
      method,
      {
        ...(await adminHeaders(server.baseUrl)),
        "Content-Type": method === "PATCH" ? "application/merge-patch+json" : "application/json",
      },
      method === "DELETE" ? undefined : { alt: "Portrait", uploadId },
    );

    expect(response.status).toBe(428);
  });

  it("refuses a photo changed since it was read", async () => {
    photoService.saveAboutPhoto.mockRejectedValue(new PreconditionFailedError());

    const response = await sendPhoto("PUT", await jsonHeaders(), { alt: "Portrait", uploadId });

    expect(response.status).toBe(412);
  });

  it.each([
    ["alt text", { alt: " ", uploadId }],
    ["an upload", { alt: "Portrait" }],
  ])("requires %s with the photo", async (_field, body) => {
    const response = await sendPhoto("PUT", await jsonHeaders(), body);

    expect(response.status).toBe(400);
    expect(photoService.saveAboutPhoto).not.toHaveBeenCalled();
  });

  it("takes a JSON body, not the file itself", async () => {
    const form = new FormData();
    form.append("file", new Blob(["image"]), "photo.png");

    const response = await fetch(`${server.baseUrl}/api/about/photo`, {
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
    expect(photoService.saveAboutPhoto).not.toHaveBeenCalled();
  });

  it("rejects a change without a CSRF token", async () => {
    const response = await sendPhoto(
      "PUT",
      { Cookie: adminSessionCookie, "Content-Type": "application/json" },
      { alt: "Portrait", uploadId },
    );

    expect(response.status).toBe(403);
    expect(photoService.saveAboutPhoto).not.toHaveBeenCalled();
  });

  it("updates the alt text", async () => {
    const response = await sendPhoto("PATCH", await mergePatchHeaders(), { alt: "New alt" });

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ photo });
    expect(photoService.updateAboutPhotoAlt).toHaveBeenCalledWith("New alt", etag);
  });

  it("takes the alt text as a merge patch, not as plain JSON", async () => {
    const response = await sendPhoto("PATCH", await jsonHeaders(), { alt: "New alt" });

    expect(response.status).toBe(415);
  });

  it("returns 404 when updating the alt text without a photo", async () => {
    photoService.updateAboutPhotoAlt.mockRejectedValue(new NotFoundError("There is no photo"));

    const response = await sendPhoto("PATCH", await mergePatchHeaders(), { alt: "New alt" });

    expect(response.status).toBe(404);
  });

  it("deletes the photo", async () => {
    const response = await sendPhoto("DELETE", await ifMatchHeaders());

    expect(response.status).toBe(204);
    expect(photoService.deleteAboutPhoto).toHaveBeenCalledWith(etag);
  });
});
