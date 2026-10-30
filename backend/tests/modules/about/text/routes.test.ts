import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders } from "../../../support/adminSession.js";
import { routeApp } from "../../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const textService = vi.hoisted(() => ({
  getAboutText: vi.fn(),
  replaceAboutText: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/about/text/service", () => textService);

import { aboutTextRouter } from "#modules/about/text/routes";
import { PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function putText(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/about/text`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "If-Match": etag, ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/about/text", aboutTextRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  textService.getAboutText.mockResolvedValue({ data: text, etag });
  textService.replaceAboutText.mockImplementation((saved: unknown) =>
    Promise.resolve({ data: saved, etag: savedEtag }),
  );
});

afterAll(() => server.close());

describe("about text routes", () => {
  it("returns the texts to every visitor, with their ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/about/text`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual({ text });
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves trimmed texts against the ETag they were read with", async () => {
    const response = await putText(
      { ...text, about: "  Иллюстратор.  " },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual({ text });
    expect(textService.replaceAboutText).toHaveBeenCalledWith(text, etag);
  });

  it("requires the ETag of the texts in If-Match", async () => {
    const response = await fetch(`${server.baseUrl}/api/about/text`, {
      body: JSON.stringify(text),
      headers: { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      method: "PUT",
    });

    expect(response.status).toBe(428);
    expect(textService.replaceAboutText).not.toHaveBeenCalled();
  });

  it("refuses texts changed since they were read", async () => {
    textService.replaceAboutText.mockRejectedValue(new PreconditionFailedError());

    const response = await putText(text, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(412);
  });

  it("reports every invalid text", async () => {
    const response = await putText(
      { about: "a".repeat(501), biography: "a".repeat(2_001), creation: "Пишет маслом." },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/about", "#/biography"]);
    expect(textService.replaceAboutText).not.toHaveBeenCalled();
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putText(text, headers);

    expect(response.status).toBe(401);
    expect(textService.replaceAboutText).not.toHaveBeenCalled();
  });

  it("rejects saving without a CSRF token", async () => {
    const { Cookie } = await adminHeaders(server.baseUrl);

    const response = await putText(text, { Cookie: String(Cookie) });

    expect(response.status).toBe(403);
    expect(textService.replaceAboutText).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await putText(text, {
      ...(await adminHeaders(server.baseUrl)),
      "Content-Type": "text/plain",
    });

    expect(response.status).toBe(415);
  });
});
