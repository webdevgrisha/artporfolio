import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import { toProcessPhotoRows } from "@/features/edit-about/model/processPhotoRows";
import { saveProcessPhotos } from "@/features/edit-about/model/saveProcessPhotos";
import { UploadError } from "@/shared/api/upload";

import { csrfHandler, problem } from "../../../support/handlers";
import { apiProcessPhoto, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

const etag = '"list-tag"';
const [a, b] = [apiProcessPhoto("a"), apiProcessPhoto("b")];

/** The uploads API: uploads get the ids `upload-1`, `upload-2`… */
function uploadsApi() {
  let count = 0;

  return mswHttp.post("/api/uploads", () => {
    count += 1;
    return HttpResponse.json({ upload: { id: `upload-${String(count)}` } }, { status: 201 });
  });
}

beforeEach(() => {
  server.use(csrfHandler, uploadsApi());
});

describe("saveProcessPhotos", () => {
  it("uploads the picked files one by one, then replaces the list in one request", async () => {
    const requests = recordRequests();
    let sent: { body: unknown; ifMatch: string | null } | undefined;
    server.use(
      mswHttp.put("/api/about/process-photos", async ({ request }) => {
        sent = { body: await request.json(), ifMatch: request.headers.get("If-Match") };
        return HttpResponse.json({ processPhotos: [b, a] }, { headers: { ETag: '"new-tag"' } });
      }),
    );
    const [rowA, rowB] = toProcessPhotoRows([a, b]);

    const saved = await saveProcessPhotos({
      etag,
      rows: [
        { ...rowB, alt: "Эскиз", file: imageFile("replacement.png") },
        { alt: "Новый этап", file: imageFile(), status: "new" },
        rowA,
      ],
    });

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "POST /api/uploads",
      "POST /api/uploads",
      "PUT /api/about/process-photos",
    ]);
    expect(sent).toEqual({
      body: {
        processPhotos: [
          { alt: "Эскиз", id: "b", uploadId: "upload-1" },
          { alt: "Новый этап", uploadId: "upload-2" },
          { alt: "Этап a", id: "a" },
        ],
      },
      ifMatch: etag,
    });
    expect(saved).toEqual({ data: [b, a], etag: '"new-tag"' });
  });

  it("does not change the list when a file was not uploaded", async () => {
    server.use(mswHttp.post("/api/uploads", () => problem(400)));
    const requests = recordRequests();

    const error = await saveProcessPhotos({
      etag,
      rows: [{ alt: "Новый этап", file: imageFile("etude.png"), status: "new" }],
    }).catch((rejection: unknown) => rejection);

    expect(error).toBeInstanceOf(UploadError);
    expect(requests).not.toContain("PUT /api/about/process-photos");
  });
});
