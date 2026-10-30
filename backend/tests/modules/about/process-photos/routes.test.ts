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
  addProcessPhoto: vi.fn(),
  deleteProcessPhoto: vi.fn(),
  getProcessPhoto: vi.fn(),
  getProcessPhotoOrder: vi.fn(),
  listProcessPhotos: vi.fn(),
  reorderProcessPhotos: vi.fn(),
  replaceProcessPhoto: vi.fn(),
  replaceProcessPhotos: vi.fn(),
  updateProcessPhotoAlt: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/about/process-photos/service", () => service);

import { processPhotosRouter } from "#modules/about/process-photos/routes";
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
const processPhoto = { ...apiImage("sketch.png"), alt: "Sketch", id };
const upload = { data: Buffer.from("image"), name: "sketch.png", size: 5 };
const uploadId = "44444444-4444-4444-8444-444444444444";
const etag = '"list-tag"';
const newEtag = '"new-list-tag"';

let server: TestServer;

function photoForm(fields: { alt?: string; file?: Blob }): FormData {
  const form = new FormData();

  if (fields.alt !== undefined) {
    form.append("alt", fields.alt);
  }

  if (fields.file) {
    form.append("file", fields.file, "sketch.png");
  }

  return form;
}

function send(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: FormData | string,
) {
  return fetch(`${server.baseUrl}/api/about/process-photos${path}`, {
    body: body ?? null,
    headers,
    method,
  });
}

async function jsonHeaders(): Promise<Record<string, string>> {
  return { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" };
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/about/process-photos", processPhotosRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.addProcessPhoto.mockResolvedValue(processPhoto);
  service.deleteProcessPhoto.mockResolvedValue(undefined);
  service.getProcessPhoto.mockResolvedValue(processPhoto);
  service.getProcessPhotoOrder.mockResolvedValue([id, otherId]);
  service.listProcessPhotos.mockResolvedValue({ etag, processPhotos: [processPhoto] });
  service.replaceProcessPhotos.mockResolvedValue({
    etag: newEtag,
    processPhotos: [processPhoto],
  });
  service.reorderProcessPhotos.mockImplementation(async (ids: string[]) => ids);
  service.replaceProcessPhoto.mockResolvedValue(processPhoto);
  service.updateProcessPhotoAlt.mockResolvedValue(processPhoto);
});

afterAll(() => server.close());

describe("process photo routes", () => {
  it("lists the photos to every visitor, with the ETag of the list", async () => {
    const response = await send("GET", "");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ processPhotos: [processPhoto] });
  });

  it("returns one photo to every visitor", async () => {
    const response = await send("GET", `/${id}`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ processPhoto });
    expect(service.getProcessPhoto).toHaveBeenCalledWith(id);
  });

  it("returns 404 for an id that is not a UUID", async () => {
    const response = await send("GET", "/sketch");

    expect(response.status).toBe(404);
    expect(service.getProcessPhoto).not.toHaveBeenCalled();
  });

  it("adds a photo and points to it", async () => {
    const response = await send(
      "POST",
      "",
      await adminHeaders(server.baseUrl),
      photoForm({ alt: "  Sketch  ", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("location")).toBe(`/api/about/process-photos/${id}`);
    await expect(response.json()).resolves.toEqual({ processPhoto });
    expect(service.addProcessPhoto).toHaveBeenCalledWith(upload, "Sketch");
  });

  it("returns 409 when the page is full", async () => {
    service.addProcessPhoto.mockRejectedValue(new ConflictError("Full"));

    const response = await send(
      "POST",
      "",
      await adminHeaders(server.baseUrl),
      photoForm({ alt: "Sketch", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(409);
  });

  it("requires alt text with a new photo", async () => {
    const response = await send(
      "POST",
      "",
      await adminHeaders(server.baseUrl),
      photoForm({ file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(400);
    expect(service.addProcessPhoto).not.toHaveBeenCalled();
  });

  it("rejects adding without a session before reading the file", async () => {
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await send(
      "POST",
      "",
      { Cookie: adminSessionCookie },
      photoForm({ alt: "Sketch", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(401);
    expect(service.addProcessPhoto).not.toHaveBeenCalled();
  });

  it("replaces the file of a photo", async () => {
    const response = await send(
      "PUT",
      `/${id}`,
      await adminHeaders(server.baseUrl),
      photoForm({ alt: "Sketch", file: new Blob(["image"]) }),
    );

    expect(response.status).toBe(200);
    expect(service.replaceProcessPhoto).toHaveBeenCalledWith(id, upload, "Sketch");
  });

  it("rejects replacing an invalid id before reading the file", async () => {
    // Not a multipart body: reading it would fail with 415, so 404 means it was never read.
    const response = await send("PUT", "/sketch", await jsonHeaders(), "{}");

    expect(response.status).toBe(404);
    expect(service.replaceProcessPhoto).not.toHaveBeenCalled();
  });

  it("updates the alt text", async () => {
    const response = await send("PATCH", `/${id}`, await jsonHeaders(), '{"alt":"New alt"}');

    expect(response.status).toBe(200);
    expect(service.updateProcessPhotoAlt).toHaveBeenCalledWith(id, "New alt");
  });

  it("returns 404 when updating a deleted photo", async () => {
    service.updateProcessPhotoAlt.mockRejectedValue(new NotFoundError("Gone"));

    const response = await send("PATCH", `/${id}`, await jsonHeaders(), '{"alt":"New alt"}');

    expect(response.status).toBe(404);
  });

  it("deletes a photo", async () => {
    const response = await send("DELETE", `/${id}`, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(204);
    expect(service.deleteProcessPhoto).toHaveBeenCalledWith(id);
  });

  it("returns the order to every visitor", async () => {
    const response = await send("GET", "/order");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ids: [id, otherId] });
    expect(service.getProcessPhoto).not.toHaveBeenCalled();
  });

  it("reorders the photos", async () => {
    const response = await send(
      "PUT",
      "/order",
      await jsonHeaders(),
      JSON.stringify({ ids: [otherId, id] }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ids: [otherId, id] });
    expect(service.reorderProcessPhotos).toHaveBeenCalledWith([otherId, id]);
  });

  it("rejects an order with a repeated id", async () => {
    const response = await send(
      "PUT",
      "/order",
      await jsonHeaders(),
      JSON.stringify({ ids: [id, id] }),
    );

    expect(response.status).toBe(400);
    expect(service.reorderProcessPhotos).not.toHaveBeenCalled();
  });

  it("returns 409 for an outdated order", async () => {
    service.reorderProcessPhotos.mockRejectedValue(new ConflictError("Outdated"));

    const response = await send(
      "PUT",
      "/order",
      await jsonHeaders(),
      JSON.stringify({ ids: [id] }),
    );

    expect(response.status).toBe(409);
  });
});

describe("replacing the process photos", () => {
  const items = [
    { alt: "  Sketch  ", id },
    { alt: "New", uploadId },
  ];

  async function putList(body: unknown, headers: Record<string, string> = { "If-Match": etag }) {
    return send("PUT", "", { ...(await jsonHeaders()), ...headers }, JSON.stringify(body));
  }

  it("replaces the list and returns it with its new ETag", async () => {
    const response = await putList({ processPhotos: items });

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(newEtag);
    await expect(response.json()).resolves.toEqual({ processPhotos: [processPhoto] });
    expect(service.replaceProcessPhotos).toHaveBeenCalledWith(
      [
        { alt: "Sketch", id },
        { alt: "New", uploadId },
      ],
      etag,
    );
  });

  it("returns 428 without If-Match", async () => {
    const response = await putList({ processPhotos: items }, {});

    expect(response.status).toBe(428);
    expect(service.replaceProcessPhotos).not.toHaveBeenCalled();
  });

  it("returns 412 when the list has changed since it was read", async () => {
    service.replaceProcessPhotos.mockRejectedValue(new PreconditionFailedError());

    const response = await putList({ processPhotos: items });

    expect(response.status).toBe(412);
  });

  it("returns 422 for an upload that has expired", async () => {
    service.replaceProcessPhotos.mockRejectedValue(new UnprocessableContentError());

    const response = await putList({ processPhotos: items });

    expect(response.status).toBe(422);
  });

  it.each([
    ["a photo with neither an id nor an upload", [{ alt: "Sketch" }]],
    [
      "a repeated id",
      [
        { alt: "Sketch", id },
        { alt: "Again", id },
      ],
    ],
    [
      "a repeated upload",
      [
        { alt: "New", uploadId },
        { alt: "Again", uploadId },
      ],
    ],
    ["an empty alt text", [{ alt: " ", id }]],
    ["an unknown field", [{ alt: "Sketch", file: "sketch.png", id }]],
    [
      "more photos than the limit",
      Array.from({ length: 31 }, (_, index) => ({
        alt: "New",
        uploadId: `${String(index).padStart(8, "0")}-4444-4444-8444-444444444444`,
      })),
    ],
  ])("rejects %s", async (_case, processPhotos) => {
    const response = await putList({ processPhotos });

    expect(response.status).toBe(400);
    expect(service.replaceProcessPhotos).not.toHaveBeenCalled();
  });

  it("rejects a change without a session", async () => {
    const headers = await jsonHeaders();
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await send(
      "PUT",
      "",
      { ...headers, "If-Match": etag },
      JSON.stringify({ processPhotos: items }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects a change without a CSRF token", async () => {
    const response = await send(
      "PUT",
      "",
      { Cookie: adminSessionCookie, "Content-Type": "application/json", "If-Match": etag },
      JSON.stringify({ processPhotos: items }),
    );

    expect(response.status).toBe(403);
  });
});
