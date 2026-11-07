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

const photoService = vi.hoisted(() => ({
  getPhoto: vi.fn(),
  savePhoto: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#shared/images/photo", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...photoService,
}));

import type { DocumentReference } from "firebase-admin/firestore";

import { photoSlotRouter } from "#modules/photo-slot/routes";
import { PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";
import { photoSlot } from "#shared/images/photo";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const photo = { ...apiImage("photo.png"), alt: "Portrait" };
const uploadId = "11111111-1111-4111-8111-111111111111";
const etag = '"read"';
const savedEtag = '"saved"';
const slot = photoSlot({
  document: () => ({}) as DocumentReference,
  field: "photo",
  folder: "test/photo",
  resource: "test-photo",
});

let server: TestServer;

function sendPhoto(method: string, headers: Record<string, string>, body?: unknown) {
  return fetch(`${server.baseUrl}/api/photo`, {
    body: body === undefined ? null : JSON.stringify(body),
    headers,
    method,
  });
}

async function jsonHeaders(): Promise<Record<string, string>> {
  return { ...(await ifMatchHeaders()), "Content-Type": "application/json" };
}

/** The headers of a signed-in admin with the ETag of the photo they read. */
async function ifMatchHeaders(): Promise<Record<string, string>> {
  return { ...(await adminHeaders(server.baseUrl)), "If-Match": etag };
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/photo", photoSlotRouter(slot)));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  photoService.getPhoto.mockResolvedValue({ data: photo, etag });
  photoService.savePhoto.mockResolvedValue({ created: false, data: photo, etag: savedEtag });
});

afterAll(() => server.close());

describe("photo slot routes", () => {
  it("returns the photo to every visitor, with its ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/photo`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual(photo);
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("returns null before a photo is uploaded", async () => {
    photoService.getPhoto.mockResolvedValue({ data: null, etag });

    const response = await fetch(`${server.baseUrl}/api/photo`);

    await expect(response.json()).resolves.toEqual(null);
  });

  it("returns 201 when the upload creates the photo", async () => {
    photoService.savePhoto.mockResolvedValue({ created: true, data: photo, etag: savedEtag });

    const response = await sendPhoto("PUT", await jsonHeaders(), { alt: "Portrait", uploadId });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(photo);
  });

  it("replaces the photo with the upload and its trimmed alt text", async () => {
    const response = await sendPhoto("PUT", await jsonHeaders(), {
      alt: "  Portrait  ",
      uploadId,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(photo);
    expect(photoService.savePhoto).toHaveBeenCalledWith(slot, { alt: "Portrait", uploadId }, etag);
  });

  it("requires the ETag of the photo", async () => {
    const response = await sendPhoto(
      "PUT",
      { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      { alt: "Portrait", uploadId },
    );

    expect(response.status).toBe(428);
  });

  it("refuses a photo changed since it was read", async () => {
    photoService.savePhoto.mockRejectedValue(new PreconditionFailedError());

    const response = await sendPhoto("PUT", await jsonHeaders(), { alt: "Portrait", uploadId });

    expect(response.status).toBe(412);
  });

  it.each([["alt text", { alt: " ", uploadId }]])(
    "requires %s with the photo",
    async (_field, body) => {
      const response = await sendPhoto("PUT", await jsonHeaders(), body);

      expect(response.status).toBe(400);
      expect(photoService.savePhoto).not.toHaveBeenCalled();
    },
  );

  it("takes a JSON body, not the file itself", async () => {
    const form = new FormData();
    form.append("file", new Blob(["image"]), "photo.png");

    const response = await fetch(`${server.baseUrl}/api/photo`, {
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
    expect(photoService.savePhoto).not.toHaveBeenCalled();
  });

  it("rejects a change without a CSRF token", async () => {
    const response = await sendPhoto(
      "PUT",
      { Cookie: adminSessionCookie, "Content-Type": "application/json" },
      { alt: "Portrait", uploadId },
    );

    expect(response.status).toBe(403);
    expect(photoService.savePhoto).not.toHaveBeenCalled();
  });

  it("keeps the file when the alt text comes alone", async () => {
    const response = await sendPhoto("PUT", await jsonHeaders(), { alt: "New alt" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(photo);
    expect(photoService.savePhoto).toHaveBeenCalledWith(slot, { alt: "New alt" }, etag);
  });

  it("has no DELETE: a photo can be replaced, not removed", async () => {
    const response = await sendPhoto("DELETE", await ifMatchHeaders());

    expect(response.status).toBe(404);
  });
});
