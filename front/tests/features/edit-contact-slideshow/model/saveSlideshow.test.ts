import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import { saveSlideshow } from "@/features/edit-contact-slideshow/model/saveSlideshow";
import { toPhotoListRow } from "@/shared/lib/photoListForm";

import { csrfHandler } from "../../../support/handlers";
import { apiListPhoto, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

const etag = '"slideshow-tag"';
const a = apiListPhoto("a");

beforeEach(() => {
  server.use(
    csrfHandler,
    mswHttp.post("/api/uploads", () => HttpResponse.json({ id: "upload-1" }, { status: 201 })),
  );
});

describe("saveSlideshow", () => {
  async function save(fromGallery: boolean) {
    let sent: { body: unknown; ifMatch: string | null } | undefined;
    server.use(
      mswHttp.put("/api/contacts/slideshow", async ({ request }) => {
        sent = { body: await request.json(), ifMatch: request.headers.get("If-Match") };
        return HttpResponse.json(
          { photos: [a], source: fromGallery ? "gallery" : "uploaded" },
          { headers: { ETag: '"new-tag"' } },
        );
      }),
    );

    const saved = await saveSlideshow({
      etag,
      values: {
        fromGallery,
        photos: [toPhotoListRow(a), { alt: "Мастерская", file: imageFile(), status: "new" }],
      },
    });

    return { saved, sent };
  }

  it("uploads the picked files, then replaces the slideshow in one request", async () => {
    const requests = recordRequests();

    const { saved, sent } = await save(false);

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "POST /api/uploads",
      "PUT /api/contacts/slideshow",
    ]);
    expect(sent).toEqual({
      body: {
        photos: [
          { alt: "Этап a", id: "a" },
          { alt: "Мастерская", uploadId: "upload-1" },
        ],
        source: "uploaded",
      },
      ifMatch: etag,
    });
    expect(saved).toEqual({ data: { photos: [a], source: "uploaded" }, etag: '"new-tag"' });
  });

  it("shows the gallery and keeps the uploaded photos when the box is ticked", async () => {
    const { sent } = await save(true);

    expect(sent?.body).toMatchObject({
      photos: [{ id: "a" }, { uploadId: "upload-1" }],
      source: "gallery",
    });
  });
});
