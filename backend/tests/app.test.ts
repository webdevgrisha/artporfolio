import type { Server } from "node:http";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app } from "#app";

let server: Server | undefined;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    const testServer = app.listen(0, "127.0.0.1");

    server = testServer;
    testServer.once("error", reject);
    testServer.once("listening", resolve);
  });

  const address = server?.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }

  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  const testServer = server;

  if (!testServer?.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    testServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("GET /api/health", () => {
  it("returns the API health status", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
