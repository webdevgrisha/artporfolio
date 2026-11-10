import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders } from "../../support/adminSession.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const contactsService = vi.hoisted(() => ({
  getContacts: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/contacts/service", () => contactsService);

import { contactsRouter } from "#modules/contacts/routes";

const admin = { email: "admin@example.com", uid: "admin-uid" };

const links = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/contacts", contactsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  contactsService.getContacts.mockResolvedValue({ links, photo: null });
});

afterAll(() => server.close());

describe("contacts routes", () => {
  it("returns the page without a session", async () => {
    const response = await fetch(`${server.baseUrl}/api/contacts`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ links, photo: null });
    expect(auth.verifySession).not.toHaveBeenCalled();
    expect(contactsService.getContacts).toHaveBeenCalledWith("ru");
  });

  it("returns the texts in the language of the query", async () => {
    const response = await fetch(`${server.baseUrl}/api/contacts?lang=pl`);

    expect(response.status).toBe(200);
    expect(contactsService.getContacts).toHaveBeenCalledWith("pl");
  });

  it("refuses a language the site does not have", async () => {
    const response = await fetch(`${server.baseUrl}/api/contacts?lang=xx`);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      errors: [{ parameter: "lang" }],
      status: 400,
    });
    expect(contactsService.getContacts).not.toHaveBeenCalled();
  });

  it("changes the links only at their own resource", async () => {
    const response = await fetch(`${server.baseUrl}/api/contacts`, {
      body: JSON.stringify(links),
      headers: { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      method: "PUT",
    });

    expect(response.status).toBe(404);
  });
});
