import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import { saveContactPhoto } from "@/features/edit-contacts/model/saveContactPhoto";
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

/** The body and the CSRF token of each request the API received, by `METHOD /path`. */
let received: Record<string, { body: unknown; token: string | null }>;

function receive(request: Request, body: unknown) {
  received[`${request.method} ${new URL(request.url).pathname}`] = {
    body,
    token: request.headers.get("X-CSRF-Token"),
  };
}

beforeEach(() => {
  received = {};
  server.use(
    csrfHandler,
    uploadsHandler,
    mswHttp.put("/api/contacts/photo", async ({ request }) => {
      const body = (await request.json()) as { alt: string };
      receive(request, body);
      return HttpResponse.json({ photo: apiPhoto(body.alt) });
    }),
    mswHttp.patch("/api/contacts/photo", async ({ request }) => {
      const body = (await request.json()) as { alt: string };
      receive(request, body);
      return HttpResponse.json({ photo: apiPhoto(body.alt) });
    }),
    mswHttp.delete("/api/contacts/photo", ({ request }) => {
      receive(request, null);
      return noContent();
    }),
  );
});

describe("saveContactPhoto", () => {
  it("uploads the file, then puts the photo by its upload with its description", async () => {
    await saveContactPhoto({ alt: "Портрет", file: imageFile(), type: "upload" });

    expect(received).toEqual({
      "PUT /api/contacts/photo": {
        body: { alt: "Портрет", uploadId },
        token: csrfToken,
      },
    });
  });

  it("updates only the description of the photo", async () => {
    await saveContactPhoto({ alt: "Автопортрет", type: "updateAlt" });

    expect(received).toEqual({
      "PATCH /api/contacts/photo": { body: { alt: "Автопортрет" }, token: csrfToken },
    });
  });

  it("deletes the photo", async () => {
    await saveContactPhoto({ type: "delete" });

    expect(received).toEqual({ "DELETE /api/contacts/photo": { body: null, token: csrfToken } });
  });

  it("rejects with the error of the server", async () => {
    server.use(mswHttp.delete("/api/contacts/photo", () => problem(503)));

    await expect(saveContactPhoto({ type: "delete" })).rejects.toBeInstanceOf(HttpError);
  });

  it("sends nothing when the CSRF token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error()));
    const requests = recordRequests();

    await expect(saveContactPhoto({ type: "delete" })).rejects.toThrow();
    expect(requests).toEqual(["GET /api/auth/csrf"]);
  });
});
