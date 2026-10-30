import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders } from "../../support/adminSession.js";
import { apiImage } from "../../support/images.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const aboutService = vi.hoisted(() => ({
  getAbout: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/about/service", () => aboutService);

import { aboutRouter } from "#modules/about/routes";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/about", aboutRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
});

afterAll(() => server.close());

describe("about routes", () => {
  it("returns the page to every visitor", async () => {
    const about = {
      text,
      photo: { ...apiImage("photo.png"), alt: "Portrait" },
      processPhotos: [
        { ...apiImage("sketch.png"), alt: "Sketch", id: "11111111-1111-4111-8111-111111111111" },
      ],
    };
    aboutService.getAbout.mockResolvedValue(about);

    const response = await fetch(`${server.baseUrl}/api/about`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(about);
  });

  it("changes the texts only at their own resource", async () => {
    const response = await fetch(`${server.baseUrl}/api/about`, {
      body: JSON.stringify(text),
      headers: { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      method: "PUT",
    });

    expect(response.status).toBe(404);
  });
});
