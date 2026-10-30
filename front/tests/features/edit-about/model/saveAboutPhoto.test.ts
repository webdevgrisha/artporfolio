import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import { saveAboutPhoto } from "@/features/edit-about/model/saveAboutPhoto";
import { HttpError } from "@/shared/api/httpError";

import {
  csrfHandler,
  csrfToken,
  noContent,
  problem,
  uploadId,
  uploadsHandler,
} from "../../../support/handlers";
import { apiPhoto, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

/** The ETag of the photo the form was made from, and of the photo each change saves. */
const etag = '"read"';
const savedEtag = '"saved"';

/** The body, CSRF token and If-Match of each change the API received, by `METHOD /path`. */
let received: Record<string, { body: unknown; ifMatch: string | null; token: string | null }>;

function receive(request: Request, body: unknown) {
  received[`${request.method} ${new URL(request.url).pathname}`] = {
    body,
    ifMatch: request.headers.get("If-Match"),
    token: request.headers.get("X-CSRF-Token"),
  };
}

function tagged(body: object) {
  return HttpResponse.json(body, { headers: { ETag: savedEtag } });
}

beforeEach(() => {
  received = {};
  server.use(
    csrfHandler,
    uploadsHandler,
    mswHttp.get("/api/about/photo", () => tagged({ photo: null })),
    mswHttp.put("/api/about/photo", async ({ request }) => {
      const body = (await request.json()) as { alt: string };
      receive(request, body);
      return tagged({ photo: apiPhoto(body.alt) });
    }),
    mswHttp.patch("/api/about/photo", async ({ request }) => {
      const body = (await request.json()) as { alt: string };
      receive(request, body);
      return tagged({ photo: apiPhoto(body.alt) });
    }),
    mswHttp.delete("/api/about/photo", ({ request }) => {
      receive(request, null);
      return noContent({ ETag: savedEtag });
    }),
  );
});

describe("saveAboutPhoto", () => {
  it("uploads the file, then puts the photo by its upload with its description", async () => {
    const saved = await saveAboutPhoto({
      change: { alt: "Портрет", file: imageFile(), type: "upload" },
      etag,
    });

    expect(received).toEqual({
      "PUT /api/about/photo": {
        body: { alt: "Портрет", uploadId },
        ifMatch: etag,
        token: csrfToken,
      },
    });
    expect(saved).toEqual({ data: apiPhoto("Портрет"), etag: savedEtag });
  });

  it("updates only the description of the photo", async () => {
    const saved = await saveAboutPhoto({ change: { alt: "Автопортрет", type: "updateAlt" }, etag });

    expect(received).toEqual({
      "PATCH /api/about/photo": { body: { alt: "Автопортрет" }, ifMatch: etag, token: csrfToken },
    });
    expect(saved).toEqual({ data: apiPhoto("Автопортрет"), etag: savedEtag });
  });

  it("deletes the photo and takes the ETag of the empty photo from the response", async () => {
    const requests = recordRequests();

    const saved = await saveAboutPhoto({ change: { type: "delete" }, etag });

    expect(received).toEqual({
      "DELETE /api/about/photo": { body: null, ifMatch: etag, token: csrfToken },
    });
    expect(requests.at(-1)).toBe("DELETE /api/about/photo");
    expect(saved).toEqual({ data: null, etag: savedEtag });
  });

  it("rejects with the error of the server", async () => {
    server.use(mswHttp.delete("/api/about/photo", () => problem(412)));

    await expect(saveAboutPhoto({ change: { type: "delete" }, etag })).rejects.toMatchObject({
      status: 412,
    });
    await expect(saveAboutPhoto({ change: { type: "delete" }, etag })).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it("sends nothing when the CSRF token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error()));
    const requests = recordRequests();

    await expect(saveAboutPhoto({ change: { type: "delete" }, etag })).rejects.toThrow();
    expect(requests).toEqual(["GET /api/auth/csrf"]);
  });
});
