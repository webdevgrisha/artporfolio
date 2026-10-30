import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import { saveAboutPhoto } from "@/features/edit-about/model/saveAboutPhoto";
import { HttpError } from "@/shared/api/httpError";

import { csrfHandler, csrfToken, noContent, problem } from "../../../support/handlers";
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
    mswHttp.put("/api/about/photo", async ({ request }) => {
      const formData = await request.formData();
      const body = { alt: formData.get("alt"), file: formData.get("file") };
      receive(request, body);
      return HttpResponse.json({ photo: apiPhoto(String(body.alt)) });
    }),
    mswHttp.patch("/api/about/photo", async ({ request }) => {
      const body = (await request.json()) as { alt: string };
      receive(request, body);
      return HttpResponse.json({ photo: apiPhoto(body.alt) });
    }),
    mswHttp.delete("/api/about/photo", ({ request }) => {
      receive(request, null);
      return noContent();
    }),
  );
});

describe("saveAboutPhoto", () => {
  it("uploads the photo with its description and the CSRF token", async () => {
    await saveAboutPhoto({ alt: "Портрет", file: imageFile(), type: "upload" });

    expect(received).toEqual({
      "PUT /api/about/photo": {
        body: { alt: "Портрет", file: expect.any(File) },
        token: csrfToken,
      },
    });
  });

  it("updates only the description of the photo", async () => {
    await saveAboutPhoto({ alt: "Автопортрет", type: "updateAlt" });

    expect(received).toEqual({
      "PATCH /api/about/photo": { body: { alt: "Автопортрет" }, token: csrfToken },
    });
  });

  it("deletes the photo", async () => {
    await saveAboutPhoto({ type: "delete" });

    expect(received).toEqual({ "DELETE /api/about/photo": { body: null, token: csrfToken } });
  });

  it("rejects with the error of the server", async () => {
    server.use(mswHttp.delete("/api/about/photo", () => problem(503)));

    await expect(saveAboutPhoto({ type: "delete" })).rejects.toBeInstanceOf(HttpError);
  });

  it("sends nothing when the CSRF token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error()));
    const requests = recordRequests();

    await expect(saveAboutPhoto({ type: "delete" })).rejects.toThrow();
    expect(requests).toEqual(["GET /api/auth/csrf"]);
  });
});
