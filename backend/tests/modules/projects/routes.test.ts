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
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  getProject: vi.fn(),
  getProjectsOrder: vi.fn(),
  listProjects: vi.fn(),
  replaceProject: vi.fn(),
  replaceProjectsOrder: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/projects/service", () => service);

import { projectsRouter } from "#modules/projects/routes";
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
const project = {
  description: "Иллюстрации к книге.",
  id,
  link: "https://elephant.com",
  photos: [{ ...apiImage("cover.png"), alt: "Обложка", id: otherId }],
  title: "Слон",
};
const body = {
  description: "Иллюстрации к книге.",
  link: "https://elephant.com",
  photos: [{ alt: "Обложка", uploadId }],
  title: "Слон",
};
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function send(method: string, path: string, headers: Record<string, string> = {}, data?: unknown) {
  return fetch(`${server.baseUrl}/api/projects${path}`, {
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

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/projects", projectsRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.listProjects.mockResolvedValue({ data: [project], etag });
  service.getProject.mockResolvedValue({ data: project, etag, id });
  service.createProject.mockResolvedValue({ data: project, etag: savedEtag, id });
  service.replaceProject.mockResolvedValue({ data: project, etag: savedEtag, id });
  service.deleteProject.mockResolvedValue(undefined);
  service.getProjectsOrder.mockResolvedValue({ data: [id, otherId], etag });
  service.replaceProjectsOrder.mockImplementation((ids: string[]) =>
    Promise.resolve({ data: ids, etag: savedEtag }),
  );
});

afterAll(() => server.close());

describe("reading the projects", () => {
  it("lists the projects to every visitor, with the ETag of the list", async () => {
    const response = await send("GET", "");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ projects: [project] });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("returns one project with its ETag", async () => {
    const response = await send("GET", `/${id}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ project });
    expect(service.getProject).toHaveBeenCalledWith(id);
  });

  it("returns 404 for a project that does not exist or an id that is not one", async () => {
    service.getProject.mockRejectedValue(new NotFoundError());

    expect((await send("GET", `/${otherId}`)).status).toBe(404);
    expect((await send("GET", "/elephant")).status).toBe(404);
  });
});

describe("creating a project", () => {
  it("creates the project and returns 201 with its location and ETag", async () => {
    const headers = await adminHeaders(server.baseUrl);

    const response = await send(
      "POST",
      "",
      { ...headers, "Content-Type": "application/json" },
      { ...body, title: "  Слон  " },
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("Location")).toBe(`/api/projects/${id}`);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ project });
    expect(service.createProject).toHaveBeenCalledWith(body);
  });

  it("reports every invalid field", async () => {
    const headers = await adminHeaders(server.baseUrl);

    const response = await send(
      "POST",
      "",
      { ...headers, "Content-Type": "application/json" },
      { ...body, link: "javascript:alert(1)", title: "" },
    );

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/title", "#/link"]);
    expect(service.createProject).not.toHaveBeenCalled();
  });

  it("rejects creating without a session or a CSRF token", async () => {
    const withoutCsrf = await send(
      "POST",
      "",
      { Cookie: adminSessionCookie, "Content-Type": "application/json" },
      body,
    );
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());
    const withoutSession = await send(
      "POST",
      "",
      { ...headers, "Content-Type": "application/json" },
      body,
    );

    expect(withoutCsrf.status).toBe(403);
    expect(withoutSession.status).toBe(401);
    expect(service.createProject).not.toHaveBeenCalled();
  });
});

describe("replacing a project", () => {
  it("replaces the project against the ETag it was read with", async () => {
    const response = await send("PUT", `/${id}`, await changeHeaders(), body);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ project });
    expect(service.replaceProject).toHaveBeenCalledWith(id, body, etag);
  });

  it("returns 428 without If-Match", async () => {
    const { "If-Match": _, ...headers } = await changeHeaders();

    const response = await send("PUT", `/${id}`, headers, body);

    expect(response.status).toBe(428);
    expect(service.replaceProject).not.toHaveBeenCalled();
  });

  it.each([
    [new PreconditionFailedError(), 412],
    [new NotFoundError(), 404],
    [new UnprocessableContentError(), 422],
  ])("passes on %o as %i", async (error, status) => {
    service.replaceProject.mockRejectedValue(error);

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

describe("deleting a project", () => {
  it("deletes the project and returns 204", async () => {
    const { "Content-Type": _, ...headers } = await changeHeaders();

    const response = await send("DELETE", `/${id}`, headers);

    expect(response.status).toBe(204);
    expect(service.deleteProject).toHaveBeenCalledWith(id, etag);
  });

  it("returns 428 without If-Match", async () => {
    const response = await send("DELETE", `/${id}`, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(428);
    expect(service.deleteProject).not.toHaveBeenCalled();
  });

  it("returns 412 for a project changed since it was read", async () => {
    service.deleteProject.mockRejectedValue(new PreconditionFailedError());

    const response = await send("DELETE", `/${id}`, await changeHeaders());

    expect(response.status).toBe(412);
  });
});

describe("the order of the projects", () => {
  it("returns the ids to every visitor, with the ETag of the order", async () => {
    const response = await send("GET", "/order");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ ids: [id, otherId] });
  });

  it("puts the projects in the new order", async () => {
    const response = await send("PUT", "/order", await changeHeaders(), { ids: [otherId, id] });

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ ids: [otherId, id] });
    expect(service.replaceProjectsOrder).toHaveBeenCalledWith([otherId, id], etag);
  });

  it("rejects an id given twice", async () => {
    const response = await send("PUT", "/order", await changeHeaders(), { ids: [id, id] });

    expect(response.status).toBe(400);
    expect(service.replaceProjectsOrder).not.toHaveBeenCalled();
  });

  it("returns 422 when the ids do not name every project", async () => {
    service.replaceProjectsOrder.mockRejectedValue(new UnprocessableContentError());

    const response = await send("PUT", "/order", await changeHeaders(), { ids: [id] });

    expect(response.status).toBe(422);
  });

  it("returns 428 without If-Match", async () => {
    const { "If-Match": _, ...headers } = await changeHeaders();

    const response = await send("PUT", "/order", headers, { ids: [otherId, id] });

    expect(response.status).toBe(428);
  });
});
