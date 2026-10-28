import type { Server } from "node:http";

import cookieParser from "cookie-parser";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("#services/auth", () => auth);
vi.mock("#services/contactPhoto", () => photoService);

import { authRouter } from "#routes/auth";
import { contactPhotoRouter } from "#routes/contactPhoto";
import { NotFoundError, UnauthorizedError } from "#shared/http/errors";
import { errorHandler } from "#shared/middleware/error";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const sessionCookie = "admin_session=firebase-session";
const photo = { alt: "Portrait", version: "version" };

let server: Server | undefined;
let baseUrl: string;

/** Cookie and CSRF headers of a signed-in admin request. */
async function adminHeaders(): Promise<Record<string, string>> {
  const response = await fetch(`${baseUrl}/api/auth/csrf`, { headers: { Cookie: sessionCookie } });
  const { csrfToken } = (await response.json()) as { csrfToken: string };
  const csrfCookie = response.headers.get("set-cookie")?.split(";", 1)[0];

  return { Cookie: `${sessionCookie}; ${String(csrfCookie)}`, "X-CSRF-Token": csrfToken };
}

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
  return fetch(`${baseUrl}/api/contacts/photo`, { body: body ?? null, headers, method });
}

beforeAll(async () => {
  const testApp = express();

  testApp.use(cookieParser());
  testApp.use(express.json());
  testApp.use("/api/auth", authRouter);
  testApp.use("/api/contacts/photo", contactPhotoRouter);
  testApp.use(errorHandler);

  await new Promise<void>((resolve, reject) => {
    const testServer = testApp.listen(0, "127.0.0.1");

    server = testServer;
    testServer.once("error", reject);
    testServer.once("listening", resolve);
  });

  const address = server?.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }

  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  photoService.deleteContactPhoto.mockResolvedValue(undefined);
  photoService.saveContactPhoto.mockResolvedValue(photo);
  photoService.updateContactPhotoAlt.mockResolvedValue(photo);
});

afterAll(async () => {
  if (!server?.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("contact photo routes", () => {
  it("uploads a photo with its alt text", async () => {
    const response = await sendPhoto(
      "PUT",
      await adminHeaders(),
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
      await adminHeaders(),
      photoForm({ alt: " ", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(400);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("requires a file", async () => {
    const response = await sendPhoto("PUT", await adminHeaders(), photoForm({ alt: "Portrait" }));

    expect(response.status).toBe(400);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("rejects an upload without a session", async () => {
    const headers = await adminHeaders();
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
      { Cookie: sessionCookie },
      photoForm({ alt: "Portrait", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(403);
    expect(photoService.saveContactPhoto).not.toHaveBeenCalled();
  });

  it("updates the alt text", async () => {
    const response = await sendPhoto(
      "PATCH",
      { ...(await adminHeaders()), "Content-Type": "application/json" },
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
      { ...(await adminHeaders()), "Content-Type": "application/json" },
      JSON.stringify({ alt: "New alt" }),
    );

    expect(response.status).toBe(404);
  });

  it("deletes the photo", async () => {
    const response = await sendPhoto("DELETE", await adminHeaders());

    expect(response.status).toBe(204);
    expect(photoService.deleteContactPhoto).toHaveBeenCalled();
  });
});
