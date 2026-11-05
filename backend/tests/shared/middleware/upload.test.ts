import express, { type RequestHandler } from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { errorHandler } from "#shared/middleware/error";
import { parseUpload } from "#shared/middleware/upload";
import { moveBodyToRawBody, readMultipartLikeCloudFunctions } from "../../support/routeApp.js";
import { startTestServer, type TestServer } from "../../support/testServer.js";

let server: TestServer;

const echoUpload: RequestHandler = (request, response) => {
  response.json({ name: request.file?.name, size: request.file?.size });
};

function upload(body: FormData | string, contentType?: string) {
  return fetch(server.baseUrl, {
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

  testApp.post("/", readMultipartLikeCloudFunctions, moveBodyToRawBody, parse, echoUpload);
  testApp.use(errorHandler);

  server = await startTestServer(testApp);
});

afterAll(() => server.close());

describe("upload middleware", () => {
  it("parses the file", async () => {
    const response = await upload(form({ file: new Blob(["12345"]) }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ name: "фото.png", size: 5 });
  });

  it("rejects a text field", async () => {
    const response = await upload(form({ alt: "Портрет", file: new Blob(["12345"]) }));

    expect(response.status).toBe(400);
  });

  it("rejects a file name longer than 255 characters", async () => {
    const response = await upload(form({ file: new Blob(["1"]) }, `${"a".repeat(252)}.png`));

    expect(response.status).toBe(400);
  });

  it("rejects a file over the size limit", async () => {
    const response = await upload(form({ file: new Blob(["12345678901"]) }));

    expect(response.status).toBe(413);
  });

  it("requires a file", async () => {
    const response = await upload(new FormData());

    expect(response.status).toBe(400);
  });

  it("rejects a file in an unexpected field", async () => {
    const response = await upload(form({ image: new Blob(["12345"]) }));

    expect(response.status).toBe(400);
  });

  it("rejects more than one file", async () => {
    const data = form({ file: new Blob(["1"]) });
    data.append("file", new Blob(["2"]), "second.png");

    const response = await upload(data);

    expect(response.status).toBe(400);
  });

  it("rejects a body that is not multipart/form-data", async () => {
    const response = await upload("{}", "application/json");

    expect(response.status).toBe(415);
  });

  it("rejects a multipart body without a boundary", async () => {
    const response = await upload("{}", "multipart/form-data");

    expect(response.status).toBe(400);
  });

  it("rejects a body that ends inside the file", async () => {
    const truncated = [
      "--boundary",
      'Content-Disposition: form-data; name="file"; filename="photo.png"',
      "Content-Type: image/png",
      "",
      "123",
    ].join("\r\n");

    const response = await upload(truncated, "multipart/form-data; boundary=boundary");

    expect(response.status).toBe(400);
    // The server is still up and answers the next upload.
    expect((await upload(form({ file: new Blob(["1"]) }))).status).toBe(200);
  });
});
