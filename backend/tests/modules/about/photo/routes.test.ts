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
  saveAboutPhoto: vi.fn(),
  updateAboutPhotoAlt: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/about/photo/service", () => photoService);

import { aboutPhotoRouter } from "#modules/about/photo/routes";
import { NotFoundError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const photo = { ...apiImage("photo.png"), alt: "Portrait" };

let server: TestServer;

function photoForm(fields: { alt?: string; file?: Blob }): FormData {
  const form = new FormData();

  if (fields.alt !== undefined) {
    form.append("alt", fields.alt);
  }

  if (fields.file) {
    form.append("file", fields.file, "photo.png");
  }

  return form;
}

function sendPhoto(method: string, headers: Record<string, string>, body?: FormData | string) {
  return fetch(`${server.baseUrl}/api/about/photo`, { body: body ?? null, headers, method });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/about/photo", aboutPhotoRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  photoService.deleteAboutPhoto.mockResolvedValue(undefined);
  photoService.saveAboutPhoto.mockResolvedValue({ created: false, photo });
  photoService.updateAboutPhotoAlt.mockResolvedValue(photo);
});

afterAll(() => server.close());

describe("about photo routes", () => {
  it("returns 201 when the upload creates the photo", async () => {
    photoService.saveAboutPhoto.mockResolvedValue({ created: true, photo });

    const response = await sendPhoto(
      "PUT",
      await adminHeaders(server.baseUrl),
      photoForm({ alt: "Portrait", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ photo });
  });

  it("replaces the photo with its trimmed alt text", async () => {
    const response = await sendPhoto(
      "PUT",
      await adminHeaders(server.baseUrl),
      photoForm({ alt: "  Portrait  ", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(200);
    expect(photoService.saveAboutPhoto).toHaveBeenCalledWith(
      { data: Buffer.from("image"), name: "photo.png", size: 5 },
      "Portrait",
    );
  });

  it("requires alt text with the photo", async () => {
    const response = await sendPhoto(
      "PUT",
      await adminHeaders(server.baseUrl),
      photoForm({ alt: " ", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(400);
    expect(photoService.saveAboutPhoto).not.toHaveBeenCalled();
  });

  it("rejects an upload without a session before reading the file", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await sendPhoto(
      "PUT",
      { Cookie: adminSessionCookie },
      photoForm({ alt: "Portrait", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(401);
    expect(photoService.saveAboutPhoto).not.toHaveBeenCalled();
  });

  it("updates the alt text", async () => {
    const response = await sendPhoto(
      "PATCH",
      { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      JSON.stringify({ alt: "New alt" }),
    );

    expect(response.status).toBe(200);
    expect(photoService.updateAboutPhotoAlt).toHaveBeenCalledWith("New alt");
  });

  it("returns 404 when updating the alt text without a photo", async () => {
    photoService.updateAboutPhotoAlt.mockRejectedValue(new NotFoundError("There is no photo"));

    const response = await sendPhoto(
      "PATCH",
      { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      JSON.stringify({ alt: "New alt" }),
    );

    expect(response.status).toBe(404);
  });

  it("deletes the photo", async () => {
    const response = await sendPhoto("DELETE", await adminHeaders(server.baseUrl));

    expect(response.status).toBe(204);
    expect(photoService.deleteAboutPhoto).toHaveBeenCalled();
  });
});
