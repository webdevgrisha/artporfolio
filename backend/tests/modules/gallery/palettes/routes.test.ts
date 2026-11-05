import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders } from "../../../support/adminSession.js";
import { routeApp } from "../../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const service = vi.hoisted(() => ({
  getGalleryPalettes: vi.fn(),
  replaceGalleryPalettes: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/gallery/palettes/service", () => service);

import { galleryPalettesRouter } from "#modules/gallery/palettes/routes";
import { PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const palettes = {
  palettes: [{ id: "11111111-1111-4111-8111-111111111111", title: "Пастельная" }],
};
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function putPalettes(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/gallery/palettes`, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "If-Match": etag,
      ...headers,
    },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/gallery/palettes", galleryPalettesRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.getGalleryPalettes.mockResolvedValue({ data: palettes, etag });
  service.replaceGalleryPalettes.mockImplementation((saved: unknown) =>
    Promise.resolve({ data: saved, etag: savedEtag }),
  );
});

afterAll(() => server.close());

describe("gallery palettes routes", () => {
  it("returns the palettes to every visitor, with their ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/gallery/palettes`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual(palettes);
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves the trimmed palettes against the ETag they were read with", async () => {
    const [pastel] = palettes.palettes;
    const response = await putPalettes(
      { palettes: [{ ...pastel, title: "  Пастельная  " }] },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(palettes);
    expect(service.replaceGalleryPalettes).toHaveBeenCalledWith(palettes, etag);
  });

  it("requires the ETag of the palettes in If-Match", async () => {
    const response = await fetch(`${server.baseUrl}/api/gallery/palettes`, {
      body: JSON.stringify(palettes),
      headers: {
        ...(await adminHeaders(server.baseUrl)),
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    expect(response.status).toBe(428);
    expect(service.replaceGalleryPalettes).not.toHaveBeenCalled();
  });

  it("refuses palettes changed since they were read", async () => {
    service.replaceGalleryPalettes.mockRejectedValue(new PreconditionFailedError());

    const response = await putPalettes(palettes, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(412);
  });

  it("points at a title used twice", async () => {
    const [pastel] = palettes.palettes;
    const response = await putPalettes(
      {
        palettes: [pastel, { id: "22222222-2222-4222-8222-222222222222", title: "пастельная" }],
      },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    const problem = (await response.json()) as {
      errors: { pointer: string }[];
    };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/palettes/1/title"]);
    expect(service.replaceGalleryPalettes).not.toHaveBeenCalled();
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putPalettes(palettes, headers);

    expect(response.status).toBe(401);
  });

  it("rejects saving without a CSRF token", async () => {
    const { Cookie } = await adminHeaders(server.baseUrl);

    const response = await putPalettes(palettes, { Cookie: String(Cookie) });

    expect(response.status).toBe(403);
  });
});
