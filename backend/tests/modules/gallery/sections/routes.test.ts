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
  createSection: vi.fn(),
  deleteSection: vi.fn(),
  getSection: vi.fn(),
  listSections: vi.fn(),
  replaceSection: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/gallery/sections/service", () => service);

import { gallerySectionsRouter } from "#modules/gallery/sections/routes";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnauthorizedError,
} from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const id = "11111111-1111-4111-8111-111111111111";
const theatreId = "33333333-3333-4333-8333-333333333333";
const body = {
  title: "Постеры",
  subsections: [{ id: theatreId, title: "Театральные" }],
  translations: {},
};
const section = { id, ...body };
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function send(method: string, path: string, headers: Record<string, string> = {}, data?: unknown) {
  return fetch(`${server.baseUrl}/api/gallery/sections${path}`, {
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
  server = await startTestServer(routeApp("/api/gallery/sections", gallerySectionsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.listSections.mockResolvedValue({ data: [section], etag });
  service.getSection.mockResolvedValue({ data: section, etag, id });
  service.createSection.mockResolvedValue({ data: section, etag: savedEtag, id });
  service.replaceSection.mockResolvedValue({ data: section, etag: savedEtag, id });
  service.deleteSection.mockResolvedValue(undefined);
});

afterAll(() => server.close());

describe("reading the sections", () => {
  it("lists the sections to every visitor, with the ETag of the list", async () => {
    const response = await send("GET", "");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ sections: [section] });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("returns one section with its ETag", async () => {
    const response = await send("GET", `/${id}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual(section);
    expect(service.getSection).toHaveBeenCalledWith(id);
  });

  it("returns 404 for a section that does not exist or an id that is not one", async () => {
    service.getSection.mockRejectedValue(new NotFoundError());

    expect((await send("GET", `/${theatreId}`)).status).toBe(404);
    expect((await send("GET", "/posters")).status).toBe(404);
  });
});

describe("creating a section", () => {
  it("creates the section with If-None-Match: * and returns 201 with its ETag", async () => {
    const response = await send("PUT", `/${id}`, await createHeaders(), {
      ...body,
      title: "  Постеры  ",
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(section);
    expect(service.createSection).toHaveBeenCalledWith(id, body);
    expect(service.replaceSection).not.toHaveBeenCalled();
  });

  it.each([
    [new PreconditionFailedError(), 412],
    [new ConflictError(), 409],
  ])("passes on %o as %i", async (error, status) => {
    service.createSection.mockRejectedValue(error);

    const response = await send("PUT", `/${id}`, await createHeaders(), body);

    expect(response.status).toBe(status);
  });

  it("reports every invalid field", async () => {
    const response = await send("PUT", `/${id}`, await createHeaders(), {
      title: "",
      subsections: [{ id: theatreId, title: "" }],
      translations: {},
    });

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual([
      "#/title",
      "#/subsections/0/title",
    ]);
    expect(service.createSection).not.toHaveBeenCalled();
  });

  it("rejects creating without a session or a CSRF token", async () => {
    const { "X-CSRF-Token": _, ...withoutCsrfHeaders } = await createHeaders();
    const withoutCsrf = await send("PUT", `/${id}`, withoutCsrfHeaders, body);
    const headers = await createHeaders();
    auth.verifySession.mockRejectedValue(new UnauthorizedError());
    const withoutSession = await send("PUT", `/${id}`, headers, body);

    expect(withoutCsrf.status).toBe(403);
    expect(withoutSession.status).toBe(401);
    expect(service.createSection).not.toHaveBeenCalled();
  });
});

describe("replacing a section", () => {
  it("replaces the section against the ETag it was read with", async () => {
    const response = await send("PUT", `/${id}`, await changeHeaders(), body);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(section);
    expect(service.replaceSection).toHaveBeenCalledWith(id, body, etag);
  });

  it("returns 428 without If-Match or If-None-Match: *", async () => {
    const { "If-Match": _, ...headers } = await changeHeaders();

    const response = await send("PUT", `/${id}`, headers, body);

    expect(response.status).toBe(428);
    expect(service.replaceSection).not.toHaveBeenCalled();
    expect(service.createSection).not.toHaveBeenCalled();
  });

  it.each([
    [new PreconditionFailedError(), 412],
    [new NotFoundError(), 404],
    [new ConflictError(), 409],
  ])("passes on %o as %i", async (error, status) => {
    service.replaceSection.mockRejectedValue(error);

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

describe("deleting a section", () => {
  it("deletes the section and returns 204", async () => {
    const { "Content-Type": _, ...headers } = await changeHeaders();

    const response = await send("DELETE", `/${id}`, headers);

    expect(response.status).toBe(204);
    expect(service.deleteSection).toHaveBeenCalledWith(id, etag);
  });

  it("returns 428 without If-Match", async () => {
    const response = await send("DELETE", `/${id}`, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(428);
    expect(service.deleteSection).not.toHaveBeenCalled();
  });

  it("returns 412 for a section changed since it was read", async () => {
    service.deleteSection.mockRejectedValue(new PreconditionFailedError());

    const response = await send("DELETE", `/${id}`, await changeHeaders());

    expect(response.status).toBe(412);
  });
});
