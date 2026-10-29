import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../support/adminSession.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

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

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/contacts/service", () => contactsService);
vi.mock("#modules/contacts/photo/service", () => photoService);

import { contactsRouter } from "#modules/contacts/routes";
import { UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };

const contacts = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

let server: TestServer;

function putContacts(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/contacts`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/contacts", contactsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  contactsService.getContacts.mockResolvedValue(contacts);
  photoService.getContactPhoto.mockResolvedValue(null);
  contactsService.saveContacts.mockResolvedValue(undefined);
});

afterAll(() => server.close());

describe("contacts routes", () => {
  it("returns contacts without a session", async () => {
    const response = await fetch(`${server.baseUrl}/api/contacts`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ contacts, photo: null });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves trimmed contacts for the admin", async () => {
    const response = await putContacts(
      { ...contacts, linkedin: "  https://linkedin.com/in/artist  " },
      await adminHeaders(server.baseUrl),
    );
    const saved = { ...contacts, linkedin: "https://linkedin.com/in/artist" };

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ contacts: saved });
    expect(contactsService.saveContacts).toHaveBeenCalledWith(saved);
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putContacts(contacts, headers);

    expect(response.status).toBe(401);
    expect(contactsService.saveContacts).not.toHaveBeenCalled();
  });

  it("rejects saving without a CSRF token", async () => {
    const response = await putContacts(contacts, {
      "Content-Type": "application/json",
      Cookie: adminSessionCookie,
    });

    expect(response.status).toBe(403);
    expect(contactsService.saveContacts).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await putContacts(contacts, {
      ...(await adminHeaders(server.baseUrl)),
      "Content-Type": "text/plain",
    });

    expect(response.status).toBe(415);
    expect(contactsService.saveContacts).not.toHaveBeenCalled();
  });

  it("rejects invalid contacts", async () => {
    const response = await putContacts(
      { ...contacts, instagram: "javascript:alert(1)" },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    expect(contactsService.saveContacts).not.toHaveBeenCalled();
  });
});
