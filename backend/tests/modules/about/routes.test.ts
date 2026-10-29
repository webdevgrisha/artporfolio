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
  saveAboutText: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/about/service", () => aboutService);

import { aboutRouter } from "#modules/about/routes";
import { UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };

let server: TestServer;

function putText(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/about`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/about", aboutRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  aboutService.saveAboutText.mockResolvedValue(undefined);
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

  it("returns an empty page before anything is saved", async () => {
    aboutService.getAbout.mockResolvedValue({ text: null, photo: null, processPhotos: [] });

    const response = await fetch(`${server.baseUrl}/api/about`);

    expect(response.status).toBe(200);
  });

  it("saves trimmed texts", async () => {
    const response = await putText(
      { ...text, about: "  Иллюстратор.  " },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ text });
    expect(aboutService.saveAboutText).toHaveBeenCalledWith(text);
  });

  it("reports every invalid text", async () => {
    const response = await putText(
      { about: "", biography: "a".repeat(2_001), creation: "Пишет маслом." },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/about", "#/biography"]);
    expect(aboutService.saveAboutText).not.toHaveBeenCalled();
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putText(text, headers);

    expect(response.status).toBe(401);
    expect(aboutService.saveAboutText).not.toHaveBeenCalled();
  });

  it("rejects saving without a CSRF token", async () => {
    const { Cookie } = await adminHeaders(server.baseUrl);

    const response = await putText(text, { Cookie: String(Cookie) });

    expect(response.status).toBe(403);
    expect(aboutService.saveAboutText).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await putText(text, {
      ...(await adminHeaders(server.baseUrl)),
      "Content-Type": "text/plain",
    });

    expect(response.status).toBe(415);
  });
});
