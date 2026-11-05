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
  getGalleryColors: vi.fn(),
  replaceGalleryColors: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/gallery/colors/service", () => service);

import { galleryColorsRouter } from "#modules/gallery/colors/routes";
import { PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const colors = {
  colors: [{ id: "11111111-1111-4111-8111-111111111111", title: "Синий", hex: "#1f4e9c" }],
};
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function putColors(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/gallery/colors`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "If-Match": etag, ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/gallery/colors", galleryColorsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.getGalleryColors.mockResolvedValue({ data: colors, etag });
  service.replaceGalleryColors.mockImplementation((saved: unknown) =>
    Promise.resolve({ data: saved, etag: savedEtag }),
  );
});

afterAll(() => server.close());

describe("gallery colors routes", () => {
  it("returns the colors to every visitor, with their ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/gallery/colors`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual(colors);
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves the colors, trimmed and in lower case, against the ETag they were read with", async () => {
    const [blue] = colors.colors;
    const response = await putColors(
      { colors: [{ ...blue, title: "  Синий  ", hex: "#1F4E9C" }] },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(colors);
    expect(service.replaceGalleryColors).toHaveBeenCalledWith(colors, etag);
  });

  it("requires the ETag of the colors in If-Match", async () => {
    const response = await fetch(`${server.baseUrl}/api/gallery/colors`, {
      body: JSON.stringify(colors),
      headers: { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      method: "PUT",
    });

    expect(response.status).toBe(428);
    expect(service.replaceGalleryColors).not.toHaveBeenCalled();
  });

  it("refuses colors changed since they were read", async () => {
    service.replaceGalleryColors.mockRejectedValue(new PreconditionFailedError());

    const response = await putColors(colors, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(412);
  });

  it("points at a title used twice", async () => {
    const [blue] = colors.colors;
    const response = await putColors(
      {
        colors: [
          blue,
          { id: "22222222-2222-4222-8222-222222222222", title: "синий", hex: "#1f4e9c" },
        ],
      },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/colors/1/title"]);
    expect(service.replaceGalleryColors).not.toHaveBeenCalled();
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putColors(colors, headers);

    expect(response.status).toBe(401);
  });

  it("rejects saving without a CSRF token", async () => {
    const { Cookie } = await adminHeaders(server.baseUrl);

    const response = await putColors(colors, { Cookie: String(Cookie) });

    expect(response.status).toBe(403);
  });
});
