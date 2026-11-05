import { QueryClient } from "@tanstack/react-query";
import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";
import { HttpError } from "@/shared/api/httpError";
import { photoSlot, saveSlotPhoto } from "@/shared/api/photoSlot";

import { csrfHandler, csrfToken, problem, uploadId } from "../../support/handlers";
import { apiPhoto } from "../../support/images";
import { recordRequests, server } from "../../support/server";

/** The ETag of the photo the form was made from, and of the photo each change saves. */
const etag = '"read"';
const savedEtag = '"saved"';
const slot = photoSlot("/contacts/photo", ["contacts", "photo"]);
const altBody = { alt: "Автопортрет" };

/** The body, CSRF token and If-Match of each change the API received, by `METHOD /path`. */
let received: Record<string, { body: unknown; ifMatch: string | null; token: string | null }>;

function receive(request: Request, body: unknown) {
  received[`${request.method} ${new URL(request.url).pathname}`] = {
    body,
    ifMatch: request.headers.get("If-Match"),
    token: request.headers.get("X-CSRF-Token"),
  };
}

function tagged(body: object | null) {
  return HttpResponse.json(body, { headers: { ETag: savedEtag } });
}

beforeEach(() => {
  received = {};
  server.use(
    csrfHandler,
    mswHttp.get("/api/contacts/photo", () => tagged(null)),
    mswHttp.put("/api/contacts/photo", async ({ request }) => {
      const body = (await request.json()) as { alt: string };
      receive(request, body);
      return tagged(apiPhoto(body.alt));
    }),
  );
});

describe("photoSlot", () => {
  it("reads the photo with its ETag", async () => {
    const queryClient = new QueryClient();

    await expect(queryClient.fetchQuery(slot.query)).resolves.toEqual({
      data: null,
      etag: savedEtag,
    });
  });
});

describe("saveSlotPhoto", () => {
  it("puts the photo with the ETag it was made from", async () => {
    const saved = await saveSlotPhoto(slot, { body: { alt: "Портрет", uploadId }, etag });

    expect(received).toEqual({
      "PUT /api/contacts/photo": {
        body: { alt: "Портрет", uploadId },
        ifMatch: etag,
        token: csrfToken,
      },
    });
    expect(saved).toEqual({ data: apiPhoto("Портрет"), etag: savedEtag });
  });

  it("rejects with the error of the server", async () => {
    server.use(mswHttp.put("/api/contacts/photo", () => problem(412)));

    await expect(saveSlotPhoto(slot, { body: altBody, etag })).rejects.toMatchObject({
      status: 412,
    });
    await expect(saveSlotPhoto(slot, { body: altBody, etag })).rejects.toBeInstanceOf(HttpError);
  });

  it("sends nothing when the CSRF token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error()));
    const requests = recordRequests();

    await expect(saveSlotPhoto(slot, { body: altBody, etag })).rejects.toThrow();
    expect(requests).toEqual(["GET /api/auth/csrf"]);
  });
});
