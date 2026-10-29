import cookieParser from "cookie-parser";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../../support/adminSession.js";
import { apiImage } from "../../../support/images.js";
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

import { authRouter } from "#modules/auth/routes";
import { photoRouter } from "#modules/contacts/photo/routes";
import { NotFoundError, UnauthorizedError } from "#shared/http/errors";
import { errorHandler } from "#shared/middleware/error";

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
  return fetch(`${server.baseUrl}/api/contacts/photo`, { body: body ?? null, headers, method });
}

beforeAll(async () => {
  const testApp = express();

  testApp.use(cookieParser());
  testApp.use(express.json());
  testApp.use("/api/auth", authRouter);
  testApp.use("/api/contacts/photo", photoRouter);
  testApp.use(errorHandler);

  server = await startTestServer(testApp);
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

    const response = await sendPhoto(
      "PUT",
      await adminHeaders(server.baseUrl),
      photoForm({ alt: "Portrait", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ photo });
  });

  it("replaces the photo with its alt text", async () => {
    const response = await sendPhoto(
      "PUT",
      await adminHeaders(server.baseUrl),
      photoForm({ alt: "  Portrait  ", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ photo });
    expect(photoService.saveContactPhoto).toHaveBeenCalledWith(
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
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("requires a file", async () => {
    const response = await sendPhoto(
      "PUT",
      await adminHeaders(server.baseUrl),
      photoForm({ alt: "Portrait" }),
    );

    expect(response.status).toBe(400);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("rejects an upload without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await sendPhoto(
      "PUT",
      headers,
      photoForm({ alt: "Portrait", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(401);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("rejects an upload without a CSRF token", async () => {
    const response = await sendPhoto(
      "PUT",
      { Cookie: adminSessionCookie },
      photoForm({ alt: "Portrait", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(403);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("updates the alt text", async () => {
    const response = await sendPhoto(
      "PATCH",
      { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      JSON.stringify({ alt: "New alt" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ photo });
    expect(photoService.updateContactPhotoAlt).toHaveBeenCalledWith("New alt");
  });

  it("returns 404 when updating the alt text without a photo", async () => {
    photoService.updateContactPhotoAlt.mockRejectedValue(new NotFoundError("There is no photo"));

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
    expect(photoService.deleteContactPhoto).toHaveBeenCalled();
  });
});
