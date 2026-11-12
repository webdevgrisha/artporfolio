import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({ addSubscriber: vi.fn() }));

vi.mock("#modules/newsletter/service", () => service);

import { newsletterRouter } from "#modules/newsletter/routes";
import { parseJsonBody } from "#shared/middleware/content-type";
import { errorHandler } from "#shared/middleware/error";
import { startTestServer, type TestServer } from "../../support/testServer.js";

let server: TestServer;

function subscribe(body: unknown, contentType = "application/json") {
  return fetch(`${server.baseUrl}/api/newsletter/subscribers`, {
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": contentType },
    method: "POST",
  });
}

beforeAll(async () => {
  // As in server.ts: before protectChanges, which would ask a visitor for the admin's session.
  const app = express();

  app.use(parseJsonBody);
  app.use("/api/newsletter", newsletterRouter);
  app.use(errorHandler);

  server = await startTestServer(app);
});

beforeEach(() => {
  vi.clearAllMocks();
  service.addSubscriber.mockResolvedValue(undefined);
});

afterAll(() => server.close());

describe("POST /api/newsletter/subscribers", () => {
  it("subscribes a visitor without a session, with the address trimmed", async () => {
    const response = await subscribe({ email: "  Anna@Example.com ", language: "pl" });

    expect(response.status).toBe(204);
    expect(service.addSubscriber).toHaveBeenCalledWith({
      email: "Anna@Example.com",
      language: "pl",
    });
  });

  it.each([
    ["an invalid address", { email: "not-an-email", language: "en" }],
    ["an address longer than SMTP delivers", { email: `${"a".repeat(250)}@a.co`, language: "en" }],
    ["a language the site does not have", { email: "anna@example.com", language: "xx" }],
    ["an unknown field", { email: "anna@example.com", language: "en", name: "Anna" }],
    ["no address", { language: "en" }],
  ])("refuses %s with 400", async (_case, body) => {
    const response = await subscribe(body);

    expect(response.status).toBe(400);
    expect(service.addSubscriber).not.toHaveBeenCalled();
  });

  it("refuses a form, which a cross-site page can send, with 415", async () => {
    const response = await subscribe(
      "email=anna%40example.com&language=en",
      "application/x-www-form-urlencoded",
    );

    expect(response.status).toBe(415);
    expect(service.addSubscriber).not.toHaveBeenCalled();
  });
});
