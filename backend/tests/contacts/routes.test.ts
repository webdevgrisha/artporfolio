import type { Server } from "node:http";

import cookieParser from "cookie-parser";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const contactsService = vi.hoisted(() => ({
  getContacts: vi.fn(),
  saveContacts: vi.fn(),
}));

const photoService = vi.hoisted(() => ({
  getContactPhoto: vi.fn(),
}));

vi.mock("#services/auth", () => auth);
vi.mock("#services/contacts", () => contactsService);
vi.mock("#services/contactPhoto", () => photoService);

import { authRouter } from "#routes/auth";
import { contactsRouter } from "#routes/contacts";
import { UnauthorizedError } from "#shared/http/errors";
import { errorHandler } from "#shared/middleware/error";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const sessionCookie = "admin_session=firebase-session";

const contacts = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

let server: Server | undefined;
let baseUrl: string;

/** Headers of a signed-in admin request with a valid CSRF token. */
async function adminHeaders(): Promise<Record<string, string>> {
  const response = await fetch(`${baseUrl}/api/auth/csrf`, { headers: { Cookie: sessionCookie } });
  const { csrfToken } = (await response.json()) as { csrfToken: string };
  const csrfCookie = response.headers.get("set-cookie")?.split(";", 1)[0];

  return {
    "Content-Type": "application/json",
    Cookie: `${sessionCookie}; ${String(csrfCookie)}`,
    "X-CSRF-Token": csrfToken,
  };
}

function putContacts(body: unknown, headers: Record<string, string>) {
  return fetch(`${baseUrl}/api/contacts`, {
    body: JSON.stringify(body),
    headers,
    method: "PUT",
  });
}

beforeAll(async () => {
  const testApp = express();

  testApp.use(cookieParser());
  testApp.use(express.json());
  testApp.use("/api/auth", authRouter);
  testApp.use("/api/contacts", contactsRouter);
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
  contactsService.getContacts.mockResolvedValue(contacts);
  photoService.getContactPhoto.mockResolvedValue(null);
  contactsService.saveContacts.mockResolvedValue(undefined);
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

describe("contacts routes", () => {
  it("returns contacts without a session", async () => {
    const response = await fetch(`${baseUrl}/api/contacts`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ contacts, photo: null });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves trimmed contacts for the admin", async () => {
    const response = await putContacts(
      { ...contacts, linkedin: "  https://linkedin.com/in/artist  " },
      await adminHeaders(),
    );
    const saved = { ...contacts, linkedin: "https://linkedin.com/in/artist" };

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ contacts: saved });
    expect(contactsService.saveContacts).toHaveBeenCalledWith(saved);
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders();
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putContacts(contacts, headers);

    expect(response.status).toBe(401);
    expect(contactsService.saveContacts).not.toHaveBeenCalled();
  });

  it("rejects saving without a CSRF token", async () => {
    const response = await putContacts(contacts, {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    });

    expect(response.status).toBe(403);
    expect(contactsService.saveContacts).not.toHaveBeenCalled();
  });

  it("rejects invalid contacts", async () => {
    const response = await putContacts(
      { ...contacts, instagram: "javascript:alert(1)" },
      await adminHeaders(),
    );

    expect(response.status).toBe(400);
    expect(contactsService.saveContacts).not.toHaveBeenCalled();
  });
});
