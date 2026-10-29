import type { Server } from "node:http";

import type { Express } from "express";

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

/** Starts the app on a free local port for requests made with fetch. */
export async function startTestServer(app: Express): Promise<TestServer> {
  const server = await new Promise<Server>((resolve, reject) => {
    const listening = app.listen(0, "127.0.0.1");

    listening.once("listening", () => resolve(listening));
    listening.once("error", reject);
  });
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }

  return {
    baseUrl: `http://127.0.0.1:${String(address.port)}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
