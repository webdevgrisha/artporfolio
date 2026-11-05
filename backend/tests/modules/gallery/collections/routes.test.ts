import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, adminSessionCookie } from "../../../support/adminSession.js";
import { apiImage } from "../../../support/images.js";
import { routeApp } from "../../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const service = vi.hoisted(() => ({
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  getCollection: vi.fn(),
  listCollections: vi.fn(),
  replaceCollection: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/gallery/collections/service", () => service);

import { galleryCollectionsRouter } from "#modules/gallery/collections/routes";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnauthorizedError,
  UnprocessableContentError,
} from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const id = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const uploadId = "44444444-4444-4444-8444-444444444444";
const collection = {
  cover: { ...apiImage("elephant.png"), alt: "Слон на закате" },
  createdAt: "2026-01-15T10:00:00.000Z",
  description: "Серия о животных.",
  endYear: 2024,
  id,
  startYear: 2023,
  title: "Звери",
  updatedAt: "2026-02-01T12:30:00.000Z",
  workIds: [otherId],
};
const body = {
  cover: { alt: "Слон на закате", uploadId },
  description: "Серия о животных.",
  endYear: 2024,
  startYear: 2023,
  title: "Звери",
  workIds: [otherId],
};
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function send(method: string, path: string, headers: Record<string, string> = {}, data?: unknown) {
  return fetch(`${server.baseUrl}/api/gallery/collections${path}`, {
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
  server = await startTestServer(routeApp("/api/gallery/collections", galleryCollectionsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.listCollections.mockResolvedValue({ data: [collection], etag });
  service.getCollection.mockResolvedValue({ data: collection, etag, id });
  service.createCollection.mockResolvedValue({ data: collection, etag: savedEtag, id });
  service.replaceCollection.mockResolvedValue({ data: collection, etag: savedEtag, id });
  service.deleteCollection.mockResolvedValue(undefined);
});

afterAll(() => server.close());

describe("reading the collections", () => {
  it("lists the collections to every visitor, with the ETag of the list", async () => {
    const response = await send("GET", "");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ collections: [collection] });
    expect(service.listCollections).toHaveBeenCalledWith("visitor");
    expect(response.headers.get("Vary")).toBe("Cookie");
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("lists the hidden works too to the admin, in an answer no shared cache keeps", async () => {
    const response = await send("GET", "", { Cookie: adminSessionCookie });

    expect(response.status).toBe(200);
    expect(service.listCollections).toHaveBeenCalledWith("admin");
    expect(response.headers.get("Vary")).toBe("Cookie");
    expect(response.headers.get("Cache-Control")).toBe("private, no-cache");
  });

  it("returns 401 for a session that has ended rather than answering as to a visitor", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await send("GET", `/${id}`, { Cookie: adminSessionCookie });

    expect(response.status).toBe(401);
    expect(service.getCollection).not.toHaveBeenCalled();
  });

  it("returns one collection with its ETag", async () => {
    const response = await send("GET", `/${id}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual(collection);
    expect(service.getCollection).toHaveBeenCalledWith(id, "visitor");
  });

  it("returns 404 for a collection that does not exist or an id that is not one", async () => {
    service.getCollection.mockRejectedValue(new NotFoundError());

    expect((await send("GET", `/${otherId}`)).status).toBe(404);
    expect((await send("GET", "/animals")).status).toBe(404);
  });
});

describe("creating a collection", () => {
  it("creates the collection with If-None-Match: * and returns 201 with its ETag", async () => {
    const response = await send("PUT", `/${id}`, await createHeaders(), {
      ...body,
      title: "  Звери  ",
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(collection);
    expect(service.createCollection).toHaveBeenCalledWith(id, body);
    expect(service.replaceCollection).not.toHaveBeenCalled();
  });

  it.each([
    [new PreconditionFailedError(), 412],
    [new ConflictError(), 409],
    [new UnprocessableContentError(), 422],
  ])("passes on %o as %i when creating", async (error, status) => {
    service.createCollection.mockRejectedValue(error);

    const response = await send("PUT", `/${id}`, await createHeaders(), body);

    expect(response.status).toBe(status);
  });

  it("reports every invalid field", async () => {
    const response = await send("PUT", `/${id}`, await createHeaders(), {
      ...body,
      endYear: body.startYear,
      title: "",
    });

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/title", "#/endYear"]);
    expect(service.createCollection).not.toHaveBeenCalled();
  });

  it("rejects creating without a session or a CSRF token", async () => {
    const { "X-CSRF-Token": _, ...withoutCsrfHeaders } = await createHeaders();
    const withoutCsrf = await send("PUT", `/${id}`, withoutCsrfHeaders, body);
    const headers = await createHeaders();
    auth.verifySession.mockRejectedValue(new UnauthorizedError());
    const withoutSession = await send("PUT", `/${id}`, headers, body);

    expect(withoutCsrf.status).toBe(403);
    expect(withoutSession.status).toBe(401);
    expect(service.createCollection).not.toHaveBeenCalled();
  });
});

describe("replacing a collection", () => {
  it("replaces the collection against the ETag it was read with", async () => {
    const response = await send("PUT", `/${id}`, await changeHeaders(), body);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(collection);
    expect(service.replaceCollection).toHaveBeenCalledWith(id, body, etag);
  });

  it("returns 428 without If-Match or If-None-Match: *", async () => {
    const { "If-Match": _, ...headers } = await changeHeaders();

    const response = await send("PUT", `/${id}`, headers, body);

    expect(response.status).toBe(428);
    expect(service.replaceCollection).not.toHaveBeenCalled();
    expect(service.createCollection).not.toHaveBeenCalled();
  });

  it.each([
    [new PreconditionFailedError(), 412],
    [new ConflictError(), 409],
    [new NotFoundError(), 404],
  ])("passes on %o as %i", async (error, status) => {
    service.replaceCollection.mockRejectedValue(error);

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

describe("deleting a collection", () => {
  it("deletes the collection and returns 204", async () => {
    const { "Content-Type": _, ...headers } = await changeHeaders();

    const response = await send("DELETE", `/${id}`, headers);

    expect(response.status).toBe(204);
    expect(service.deleteCollection).toHaveBeenCalledWith(id, etag);
  });

  it("returns 428 without If-Match", async () => {
    const response = await send("DELETE", `/${id}`, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(428);
    expect(service.deleteCollection).not.toHaveBeenCalled();
  });

  it("returns 412 for a collection changed since it was read", async () => {
    service.deleteCollection.mockRejectedValue(new PreconditionFailedError());

    const response = await send("DELETE", `/${id}`, await changeHeaders());

    expect(response.status).toBe(412);
  });
});
