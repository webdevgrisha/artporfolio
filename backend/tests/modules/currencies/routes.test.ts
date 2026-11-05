import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHeaders } from "../../support/adminSession.js";
import { routeApp } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

const auth = vi.hoisted(() => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  verifySession: vi.fn(),
}));

const service = vi.hoisted(() => ({
  getCurrencyRates: vi.fn(),
  replaceCurrencyRates: vi.fn(),
}));

vi.mock("#modules/auth/service", () => auth);
vi.mock("#modules/currencies/service", () => service);

import { currenciesRouter } from "#modules/currencies/routes";
import { PreconditionFailedError, UnauthorizedError } from "#shared/http/errors";

const admin = { email: "admin@example.com", uid: "admin-uid" };
const rates = { rates: { EUR: 0.92, PLN: 3.65 } };
const etag = '"read"';
const savedEtag = '"saved"';

let server: TestServer;

function putRates(body: unknown, headers: Record<string, string>) {
  return fetch(`${server.baseUrl}/api/currencies`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "If-Match": etag, ...headers },
    method: "PUT",
  });
}

beforeAll(async () => {
  server = await startTestServer(routeApp("/api/currencies", currenciesRouter));
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.verifySession.mockResolvedValue(admin);
  service.getCurrencyRates.mockResolvedValue({ data: rates, etag });
  service.replaceCurrencyRates.mockImplementation((saved: unknown) =>
    Promise.resolve({ data: saved, etag: savedEtag }),
  );
});

afterAll(() => server.close());

describe("currencies routes", () => {
  it("returns the rates to every visitor, with their ETag", async () => {
    const response = await fetch(`${server.baseUrl}/api/currencies`);

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(etag);
    await expect(response.json()).resolves.toEqual(rates);
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it("saves the rates against the ETag they were read with", async () => {
    const response = await putRates(rates, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe(savedEtag);
    await expect(response.json()).resolves.toEqual(rates);
    expect(service.replaceCurrencyRates).toHaveBeenCalledWith(rates, etag);
  });

  it("requires the ETag of the rates in If-Match", async () => {
    const response = await fetch(`${server.baseUrl}/api/currencies`, {
      body: JSON.stringify(rates),
      headers: { ...(await adminHeaders(server.baseUrl)), "Content-Type": "application/json" },
      method: "PUT",
    });

    expect(response.status).toBe(428);
    expect(service.replaceCurrencyRates).not.toHaveBeenCalled();
  });

  it("refuses rates changed since they were read", async () => {
    service.replaceCurrencyRates.mockRejectedValue(new PreconditionFailedError());

    const response = await putRates(rates, await adminHeaders(server.baseUrl));

    expect(response.status).toBe(412);
  });

  it("points at a rate that is not valid", async () => {
    const response = await putRates(
      { rates: { EUR: 0, PLN: 3.65 } },
      await adminHeaders(server.baseUrl),
    );

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: { pointer: string }[] };
    expect(problem.errors.map(({ pointer }) => pointer)).toEqual(["#/rates/EUR"]);
    expect(service.replaceCurrencyRates).not.toHaveBeenCalled();
  });

  it("rejects saving without a session", async () => {
    const headers = await adminHeaders(server.baseUrl);
    auth.verifySession.mockRejectedValue(new UnauthorizedError());

    const response = await putRates(rates, headers);

    expect(response.status).toBe(401);
  });

  it("rejects saving without a CSRF token", async () => {
    const { Cookie } = await adminHeaders(server.baseUrl);

    const response = await putRates(rates, { Cookie: String(Cookie) });

    expect(response.status).toBe(403);
  });
});
