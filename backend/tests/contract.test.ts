import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { contractViolations } from "./support/contract.ts";
import { startTestServer, type TestServer } from "./support/testServer.js";

let server: TestServer;

beforeAll(async () => {
  const app = express();

  app.get("/api/health", (request, response) => {
    if (request.query.status === "teapot") {
      response.status(418).json({ status: "ok" });
      return;
    }

    response.json({ status: "down" });
  });
  app.get("/api/undocumented", (_request, response) => {
    response.json({ anything: true });
  });

  server = await startTestServer(app);
});

afterAll(() => server.close());

describe("contract check", () => {
  it("reports a body that does not match the documented schema", async () => {
    await fetch(`${server.baseUrl}/api/health`);

    expect(contractViolations.splice(0)).toEqual([
      expect.stringMatching(/^GET \/api\/health → 200: .*must be equal to constant/),
    ]);
  });

  it("reports a status that is not documented", async () => {
    await fetch(`${server.baseUrl}/api/health?status=teapot`);

    expect(contractViolations.splice(0)).toEqual([
      "GET /api/health → 418: the status is not documented",
    ]);
  });

  it("ignores paths that are not in the document", async () => {
    await fetch(`${server.baseUrl}/api/undocumented`);

    expect(contractViolations).toEqual([]);
  });
});
