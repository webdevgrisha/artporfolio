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
  listProcessPhotos: vi.fn(),
  replaceProcessPhotos: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/about/process-photos/service", () => service);

import { processPhotosRouter } from "#modules/about/process-photos/routes";
import {
  PreconditionFailedError,
  UnauthorizedError,
  UnprocessableContentError,
} from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const id = "11111111-1111-4111-8111-111111111111";
const processPhoto = { ...apiImage("sketch.png"), alt: "Sketch", id };
const uploadId = "44444444-4444-4444-8444-444444444444";
const etag = '"list-tag"';
const newEtag = '"new-list-tag"';

let server: TestServer;

function send(method: string, path: string, headers: Record<string, string> = {}, body?: string) {
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
  service.listProcessPhotos.mockResolvedValue({ data: [processPhoto], etag });
  service.replaceProcessPhotos.mockResolvedValue({ data: [processPhoto], etag: newEtag });
});

afterAll(() => server.close());

describe("listing the process photos", () => {
  it("lists the photos to every visitor, with the ETag of the list", async () => {
    const response = await send("GET", "");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ processPhotos: [processPhoto] });
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

  it("rejects an invalid list", async () => {
    const response = await putList({ processPhotos: [{ alt: "Sketch" }] });

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
