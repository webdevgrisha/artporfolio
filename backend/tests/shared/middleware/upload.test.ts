import express, { type RequestHandler } from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { errorHandler } from "#shared/middleware/error";
import { parseUpload } from "#shared/middleware/upload";
import { startTestServer, type TestServer } from "../../support/testServer.js";

let server: TestServer;

const echoUpload: RequestHandler = (request, response) => {
  response.json({
    body: request.body,
    file: { name: request.file?.name, size: request.file?.size },
  });
};

// Cloud Functions reads the body before Express does and leaves it in request.rawBody.
const readBodyLikeCloudFunctions = express.raw({ type: "multipart/form-data" });
const moveBodyToRawBody: RequestHandler = (request, _response, next) => {
  request.rawBody = request.body as Buffer;
  next();
};

function upload(path: string, body: FormData | string, contentType?: string) {
  return fetch(`${server.baseUrl}${path}`, {
    body,
    method: "POST",
    ...(contentType ? { headers: { "Content-Type": contentType } } : {}),
  });
}

function form(fields: Record<string, string | Blob>, fileName = "фото.png"): FormData {
  const data = new FormData();

  for (const [name, value] of Object.entries(fields)) {
    if (value instanceof Blob) {
      data.append(name, value, fileName);
    } else {
      data.append(name, value);
    }
  }

  return data;
}

beforeAll(async () => {
  const testApp = express();
  const parse = parseUpload({ fileField: "file", maxFileSize: 10 });

  testApp.post("/stream", parse, echoUpload);
  testApp.post("/raw-body", readBodyLikeCloudFunctions, moveBodyToRawBody, parse, echoUpload);
  testApp.use(errorHandler);

  server = await startTestServer(testApp);
});

afterAll(() => server.close());

describe("upload middleware", () => {
  it.each(["/stream", "/raw-body"])("parses the file and text fields at %s", async (path) => {
    const response = await upload(path, form({ alt: "Портрет", file: new Blob(["12345"]) }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      body: { alt: "Портрет" },
      file: { name: "фото.png", size: 5 },
    });
  });

  it("keeps a __proto__ field as a plain field", async () => {
    const data = form({ file: new Blob(["1"]) });
    data.append("__proto__", "polluted");

    const response = await upload("/stream", data);
    const { body } = (await response.json()) as { body: object };

    expect(response.status).toBe(200);
    expect(Object.getOwnPropertyDescriptor(body, "__proto__")?.value).toBe("polluted");
  });

  it("rejects a file name longer than 255 characters", async () => {
    const response = await upload(
      "/stream",
      form({ file: new Blob(["1"]) }, `${"a".repeat(252)}.png`),
    );

    expect(response.status).toBe(400);
  });

  it("rejects a file over the size limit", async () => {
    const response = await upload("/stream", form({ file: new Blob(["12345678901"]) }));

    expect(response.status).toBe(413);
  });

  it("requires a file", async () => {
    const response = await upload("/stream", form({ alt: "Портрет" }));

    expect(response.status).toBe(400);
  });

  it("rejects a file in an unexpected field", async () => {
    const response = await upload("/stream", form({ image: new Blob(["12345"]) }));

    expect(response.status).toBe(400);
  });

  it("rejects more than one file", async () => {
    const data = form({ file: new Blob(["1"]) });
    data.append("file", new Blob(["2"]), "second.png");

    const response = await upload("/stream", data);

    expect(response.status).toBe(400);
  });

  it("rejects a body that is not multipart/form-data", async () => {
    const response = await upload("/stream", "{}", "application/json");

    expect(response.status).toBe(400);
  });
});
