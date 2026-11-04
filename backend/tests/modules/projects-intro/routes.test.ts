import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders } from "../../support/adminSession.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const introService = vi.hoisted(() => ({
  getProjectsIntro: vi.fn(),
  replaceProjectsIntro: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/projects-intro/service", () => introService);

import { projectsIntroRouter } from "#modules/projects-intro/routes";
import { PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const intro = { text: "Проекты, сделанные вместе с другими." };
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function putIntro(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/projects-intro`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "If-Match": etag, ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/projects-intro", projectsIntroRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  introService.getProjectsIntro.mockResolvedValue({ data: intro, etag });
  introService.replaceProjectsIntro.mockImplementation((saved: unknown) =>
    Promise.resolve({ data: saved, etag: savedEtag }),
  );
});

afterAll(() => server.close());

describe("projects intro routes", () => {
  it("returns the text to every visitor, with its ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/projects-intro`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ intro });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves the trimmed text against the ETag it was read with", async () => {
    const response = await putIntro(
      { text: `  ${intro.text}  ` },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ intro });
    expect(introService.replaceProjectsIntro).toHaveBeenCalledWith(intro, etag);
  });

  it("rejects an empty text", async () => {
    const response = await putIntro({ text: "  " }, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(400);
    expect(introService.replaceProjectsIntro).not.toHaveBeenCalled();
  });

  it("requires the ETag of the text in If-Match", async () => {
    const response = await fetch(`${server.baseUrl}/api/projects-intro`, {
      body: JSON.stringify(intro),
      headers: { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      method: "PUT",
    });

    expect(response.status).toBe(428);
    expect(introService.replaceProjectsIntro).not.toHaveBeenCalled();
  });

  it("refuses a text changed since it was read", async () => {
    introService.replaceProjectsIntro.mockRejectedValue(new PreconditionFailedError());

    const response = await putIntro(intro, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(412);
  });

  it("rejects a text over the limit and unknown fields", async () => {
    const headers = await adminHeaders(server.baseUrl);

    expect((await putIntro({ text: "a".repeat(1_001) }, headers)).status).toBe(400);
    expect((await putIntro({ ...intro, title: "Проекты" }, headers)).status).toBe(400);
    expect(introService.replaceProjectsIntro).not.toHaveBeenCalled();
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putIntro(intro, headers);

    expect(response.status).toBe(401);
  });

  it("rejects saving without a CSRF token", async () => {
    const { Cookie } = await adminHeaders(server.baseUrl);

    const response = await putIntro(intro, { Cookie: String(Cookie) });

    expect(response.status).toBe(403);
  });
});
