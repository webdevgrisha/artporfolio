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
  getGalleryMaterials: vi.fn(),
  replaceGalleryMaterials: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/gallery/materials/service", () => service);

import { galleryMaterialsRouter } from "#modules/gallery/materials/routes";
import { PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const materials = {
  materials: [{ id: "11111111-1111-4111-8111-111111111111", title: "Акварель" }],
};
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function putMaterials(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/gallery/materials`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "If-Match": etag, ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/gallery/materials", galleryMaterialsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.getGalleryMaterials.mockResolvedValue({ data: materials, etag });
  service.replaceGalleryMaterials.mockImplementation((saved: unknown) =>
    Promise.resolve({ data: saved, etag: savedEtag }),
  );
});

afterAll(() => server.close());

describe("gallery materials routes", () => {
  it("returns the materials to every visitor, with their ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/gallery/materials`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual(materials);
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves the trimmed materials against the ETag they were read with", async () => {
    const [watercolor] = materials.materials;
    const response = await putMaterials(
      { materials: [{ ...watercolor, title: "  Акварель  " }] },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(materials);
    expect(service.replaceGalleryMaterials).toHaveBeenCalledWith(materials, etag);
  });

  it("requires the ETag of the materials in If-Match", async () => {
    const response = await fetch(`${server.baseUrl}/api/gallery/materials`, {
      body: JSON.stringify(materials),
      headers: { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      method: "PUT",
    });

    expect(response.status).toBe(428);
    expect(service.replaceGalleryMaterials).not.toHaveBeenCalled();
  });

  it("refuses materials changed since they were read", async () => {
    service.replaceGalleryMaterials.mockRejectedValue(new PreconditionFailedError());

    const response = await putMaterials(materials, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(412);
  });

  it("points at a title used twice", async () => {
    const [watercolor] = materials.materials;
    const response = await putMaterials(
      {
        materials: [watercolor, { id: "22222222-2222-4222-8222-222222222222", title: "акварель" }],
      },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/materials/1/title"]);
    expect(service.replaceGalleryMaterials).not.toHaveBeenCalled();
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putMaterials(materials, headers);

    expect(response.status).toBe(401);
  });

  it("rejects saving without a CSRF token", async () => {
    const { Cookie } = await adminHeaders(server.baseUrl);

    const response = await putMaterials(materials, { Cookie: String(Cookie) });

    expect(response.status).toBe(403);
  });
});
