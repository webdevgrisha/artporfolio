import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../support/adminSession.js";
import { apiImage } from "../../support/images.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const service = vi.hoisted(() => ({
  createWork: vi.fn(),
  deleteWork: vi.fn(),
  getWork: vi.fn(),
  getWorkUsage: vi.fn(),
  listWorks: vi.fn(),
  replaceWork: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/gallery-works/service", () => service);

import { galleryWorksRouter } from "#modules/gallery-works/routes";
import {
  NotFoundError,
  PreconditionFailedError,
  UnauthorizedError,
  UnprocessableContentError,
} from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const id = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const uploadId = "44444444-4444-4444-8444-444444444444";
const work = {
  createdAt: "2026-01-15T10:00:00.000Z",
  description: "Масло, холст.",
  id,
  photo: { ...apiImage("elephant.png"), alt: "Слон на закате" },
  processPhotos: [{ ...apiImage("sketch.png"), alt: "Набросок", id: otherId }],
  sectionIds: [otherId],
  materialIds: [otherId],
  colorIds: [otherId],
  paletteIds: [otherId],
  collectionId: otherId,
  format: "single",
  partCount: null,
  saleStatus: "sold",
  price: { amount: 500, currency: "USD", discountPercent: 10, finalAmount: 450 },
  size: { height: 70, width: 50 },
  published: true,
  title: "Слон",
  updatedAt: "2026-02-01T12:30:00.000Z",
  year: 2024,
  month: 3,
  country: "PL",
  city: "Варшава",
};
// The list returns each work without its description and process photos.
const { description: _description, processPhotos: _processPhotos, ...workSummary } = work;
const body = {
  description: "Масло, холст.",
  photo: { alt: "Слон на закате", uploadId },
  processPhotos: [{ alt: "Набросок", id: otherId }],
  sectionIds: [otherId],
  materialIds: [otherId],
  colorIds: [otherId],
  paletteIds: [otherId],
  collectionId: otherId,
  format: "single",
  partCount: null,
  saleStatus: "sold",
  price: { amount: 500, currency: "USD", discountPercent: 10 },
  size: { height: 70, width: 50 },
  published: true,
  title: "Слон",
  year: 2024,
  month: 3,
  country: "PL",
  city: "Варшава",
};
const usage = {
  sections: { [otherId]: { count: 1, onlyCount: 1 } },
  materials: {},
  colors: {},
  palettes: {},
};
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function send(method: string, path: string, headers: Record<string, string> = {}, data?: unknown) {
  return fetch(`${server.baseUrl}/api/gallery-works${path}`, {
    body: data === undefined ? null : JSON.stringify(data),
    headers,
    method,
  });
}

async function changeHeaders(): Promise<Record<string, string>> {
  return {
    ...(await adminHeaders(server.baseUrl)),
    "Content-Type": "application/json",
    "If-Match": etag,
  };
}

async function createHeaders(): Promise<Record<string, string>> {
  const { "If-Match": _, ...headers } = await changeHeaders();

  return { ...headers, "If-None-Match": "*" };
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/gallery-works", galleryWorksRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.listWorks.mockResolvedValue({ data: [workSummary], etag });
  service.getWork.mockResolvedValue({ data: work, etag, id });
  service.getWorkUsage.mockResolvedValue({ data: usage, etag });
  service.createWork.mockResolvedValue({ data: work, etag: savedEtag, id });
  service.replaceWork.mockResolvedValue({ data: work, etag: savedEtag, id });
  service.deleteWork.mockResolvedValue(undefined);
});

afterAll(() => server.close());

describe("reading the works", () => {
  it("lists the works to every visitor, with the ETag of the list", async () => {
    const response = await send("GET", "");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ works: [workSummary] });
    expect(service.listWorks).toHaveBeenCalledWith("visitor");
    expect(response.headers.get("Vary")).toBe("Cookie");
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("lists the hidden works too to the admin, in an answer no shared cache keeps", async () => {
    const response = await send("GET", "", { Cookie: adminSessionCookie });

    expect(response.status).toBe(200);
    expect(service.listWorks).toHaveBeenCalledWith("admin");
    expect(response.headers.get("Vary")).toBe("Cookie");
    expect(response.headers.get("Cache-Control")).toBe("private, no-cache");
  });

  it("returns 401 for a session that has ended rather than answering as to a visitor", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await send("GET", `/${id}`, { Cookie: adminSessionCookie });

    expect(response.status).toBe(401);
    expect(service.getWork).not.toHaveBeenCalled();
  });

  it("returns how the works use each item of the lists, with its ETag", async () => {
    const response = await send("GET", "/usage");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ usage });
    expect(service.getWorkUsage).toHaveBeenCalledWith("visitor");
    expect(service.getWork).not.toHaveBeenCalled();
  });

  it("returns one work with its ETag", async () => {
    const response = await send("GET", `/${id}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ work });
    expect(service.getWork).toHaveBeenCalledWith(id, "visitor");
  });

  it("returns 404 for a work that does not exist or an id that is not one", async () => {
    service.getWork.mockRejectedValue(new NotFoundError());

    expect((await send("GET", `/${otherId}`)).status).toBe(404);
    expect((await send("GET", "/elephant")).status).toBe(404);
  });
});

describe("creating a work", () => {
  it("creates the work with If-None-Match: * and returns 201 with its ETag", async () => {
    const response = await send("PUT", `/${id}`, await createHeaders(), {
      ...body,
      title: "  Слон  ",
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ work });
    expect(service.createWork).toHaveBeenCalledWith(id, body);
    expect(service.replaceWork).not.toHaveBeenCalled();
  });

  it.each([
    [new PreconditionFailedError(), 412],
    [new UnprocessableContentError(), 422],
  ])("passes on %o as %i when creating", async (error, status) => {
    service.createWork.mockRejectedValue(error);

    const response = await send("PUT", `/${id}`, await createHeaders(), body);

    expect(response.status).toBe(status);
  });

  it("reports every invalid field", async () => {
    const response = await send("PUT", `/${id}`, await createHeaders(), {
      ...body,
      size: { ...body.size, width: 0 },
      title: "",
    });

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/title", "#/size/width"]);
    expect(service.createWork).not.toHaveBeenCalled();
  });

  it("rejects creating without a session or a CSRF token", async () => {
    const { "X-CSRF-Token": _, ...withoutCsrfHeaders } = await createHeaders();
    const withoutCsrf = await send("PUT", `/${id}`, withoutCsrfHeaders, body);
    const headers = await createHeaders();
    auth.verifySession.mockRejectedValue(new UnauthorizedError());
    const withoutSession = await send("PUT", `/${id}`, headers, body);

    expect(withoutCsrf.status).toBe(403);
    expect(withoutSession.status).toBe(401);
    expect(service.createWork).not.toHaveBeenCalled();
  });
});

describe("replacing a work", () => {
  it("replaces the work against the ETag it was read with", async () => {
    const response = await send("PUT", `/${id}`, await changeHeaders(), body);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ work });
    expect(service.replaceWork).toHaveBeenCalledWith(id, body, etag);
  });

  it("returns 428 without If-Match or If-None-Match: *", async () => {
    const { "If-Match": _, ...headers } = await changeHeaders();

    const response = await send("PUT", `/${id}`, headers, body);

    expect(response.status).toBe(428);
    expect(service.replaceWork).not.toHaveBeenCalled();
    expect(service.createWork).not.toHaveBeenCalled();
  });

  it.each([
    [new PreconditionFailedError(), 412],
    [new NotFoundError(), 404],
  ])("passes on %o as %i", async (error, status) => {
    service.replaceWork.mockRejectedValue(error);

    const response = await send("PUT", `/${id}`, await changeHeaders(), body);

    expect(response.status).toBe(status);
  });

  it("rejects a body that is not JSON", async () => {
    const response = await send(
      "PUT",
      `/${id}`,
      { ...(await changeHeaders()), "Content-Type": "text/plain" },
      body,
    );

    expect(response.status).toBe(415);
  });
});

describe("deleting a work", () => {
  it("deletes the work and returns 204", async () => {
    const { "Content-Type": _, ...headers } = await changeHeaders();

    const response = await send("DELETE", `/${id}`, headers);

    expect(response.status).toBe(204);
    expect(service.deleteWork).toHaveBeenCalledWith(id, etag);
  });

  it("returns 428 without If-Match", async () => {
    const response = await send("DELETE", `/${id}`, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(428);
    expect(service.deleteWork).not.toHaveBeenCalled();
  });

  it("returns 412 for a work changed since it was read", async () => {
    service.deleteWork.mockRejectedValue(new PreconditionFailedError());

    const response = await send("DELETE", `/${id}`, await changeHeaders());

    expect(response.status).toBe(412);
  });
});
