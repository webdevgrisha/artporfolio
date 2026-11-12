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
  getSlideshow: vi.fn(),
  replaceSlideshow: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/contacts/slideshow/service", () => service);

import { slideshowRouter } from "#modules/contacts/slideshow/routes";
import {
  PreconditionFailedError,
  UnauthorizedError,
  UnprocessableContentError,
} from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const id = "11111111-1111-4111-8111-111111111111";
const slideshow = {
  photos: [{ ...apiImage("studio.png"), alt: "Studio", id }],
  source: "uploaded",
};
const uploadId = "44444444-4444-4444-8444-444444444444";
const etag = '"slideshow-tag"';
const newEtag = '"new-slideshow-tag"';

let server: TestServer;

function send(method: string, headers: Record<string, string> = {}, body?: string) {
  return fetch(`${server.baseUrl}/api/contacts/slideshow`, {
    body: body ?? null,
    headers,
    method,
  });
}

async function jsonHeaders(): Promise<Record<string, string>> {
  return { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" };
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/contacts/slideshow", slideshowRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.getSlideshow.mockResolvedValue({ data: slideshow, etag });
  service.replaceSlideshow.mockResolvedValue({ data: slideshow, etag: newEtag });
});

afterAll(() => server.close());

describe("reading the slideshow", () => {
  it("returns the slideshow to every visitor, with its ETag", async () => {
    const response = await send("GET");

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual(slideshow);
    expect(auth.verifySession).not.toHaveBeenCalled();
  });
});

describe("replacing the slideshow", () => {
  const body = {
    photos: [
      { alt: "  Studio  ", id },
      { alt: "New", uploadId },
    ],
    source: "gallery",
  };

  async function put(value: unknown, headers: Record<string, string> = { "If-Match": etag }) {
    return send("PUT", { ...(await jsonHeaders()), ...headers }, JSON.stringify(value));
  }

  it("replaces the slideshow and returns it with its new ETag", async () => {
    const response = await put(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(newEtag);
    await expect(response.json()).resolves.toEqual(slideshow);
    expect(service.replaceSlideshow).toHaveBeenCalledWith(
      {
        photos: [
          { alt: "Studio", id },
          { alt: "New", uploadId },
        ],
        source: "gallery",
      },
      etag,
    );
  });

  it("returns 428 without If-Match", async () => {
    const response = await put(body, {});

    expect(response.status).toBe(428);
    expect(service.replaceSlideshow).not.toHaveBeenCalled();
  });

  it("returns 412 when the slideshow has changed since it was read", async () => {
    service.replaceSlideshow.mockRejectedValue(new PreconditionFailedError());

    const response = await put(body);

    expect(response.status).toBe(412);
  });

  it("returns 422 for an upload that has expired", async () => {
    service.replaceSlideshow.mockRejectedValue(new UnprocessableContentError());

    const response = await put(body);

    expect(response.status).toBe(422);
  });

  it.each([
    ["a source the slideshow does not have", { ...body, source: "projects" }],
    ["no source", { photos: body.photos }],
    ["no photos", { source: "gallery" }],
    [
      "more than 10 photos",
      {
        photos: Array.from({ length: 11 }, () => ({ alt: "Photo", uploadId })),
        source: "uploaded",
      },
    ],
  ])("rejects %s", async (_case, value) => {
    const response = await put(value);

    expect(response.status).toBe(400);
    expect(service.replaceSlideshow).not.toHaveBeenCalled();
  });

  it("rejects a change without a session", async () => {
    const headers = await jsonHeaders();
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await send("PUT", { ...headers, "If-Match": etag }, JSON.stringify(body));

    expect(response.status).toBe(401);
  });

  it("rejects a change without a CSRF token", async () => {
    const response = await send(
      "PUT",
      { Cookie: adminSessionCookie, "Content-Type": "application/json", "If-Match": etag },
      JSON.stringify(body),
    );

    expect(response.status).toBe(403);
  });
});
