import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProcessPhotosChanges } from "@/features/edit-about/model/processPhotosChanges";
import {
  SaveProcessPhotoError,
  saveProcessPhotos,
} from "@/features/edit-about/model/saveProcessPhotos";
import { HttpError } from "@/shared/api/httpError";

import { csrfHandler, noContent, problem } from "../../../support/handlers";
import { apiProcessPhoto, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

const saved = [apiProcessPhoto("a"), apiProcessPhoto("b"), apiProcessPhoto("c")];
const [a, b, c] = saved;

/** The process photos API: added photos get the ids `new-1`, `new-2`… */
function processPhotosApi() {
  let addedCount = 0;

  return [
    mswHttp.delete("/api/about/process-photos/:id", () => noContent()),
    mswHttp.post("/api/about/process-photos", async ({ request }) => {
      const alt = String((await request.formData()).get("alt"));
      addedCount += 1;
      return HttpResponse.json(
        { processPhoto: apiProcessPhoto(`new-${String(addedCount)}`, alt) },
        { status: 201 },
      );
    }),
    // Before `:id`, which would match `order` too.
    mswHttp.put("/api/about/process-photos/order", async ({ request }) =>
      HttpResponse.json(await request.json()),
    ),
    mswHttp.put("/api/about/process-photos/:id", async ({ params, request }) => {
      const alt = String((await request.formData()).get("alt"));
      return HttpResponse.json({ processPhoto: apiProcessPhoto(String(params.id), alt) });
    }),
    mswHttp.patch("/api/about/process-photos/:id", async ({ params, request }) => {
      const { alt } = (await request.json()) as { alt: string };
      return HttpResponse.json({ processPhoto: apiProcessPhoto(String(params.id), alt) });
    }),
  ];
}

/** The error a save rejected with. */
async function getSaveError(changes: ProcessPhotosChanges): Promise<unknown> {
  return saveProcessPhotos(changes, () => {}).then(
    () => undefined,
    (error: unknown) => error,
  );
}

beforeEach(() => {
  server.use(csrfHandler, ...processPhotosApi());
});

describe("saveProcessPhotos", () => {
  it("deletes first, then saves the changed rows in order, then puts the photos in the new order", async () => {
    const requests = recordRequests();
    const onRowSaved = vi.fn();
    let order: { ids: string[] } | undefined;
    server.use(
      mswHttp.put("/api/about/process-photos/order", async ({ request }) => {
        order = (await request.json()) as { ids: string[] };
        return HttpResponse.json(order);
      }),
    );

    await saveProcessPhotos(
      {
        deleted: [b],
        isReordered: true,
        steps: [
          { alt: "Новый этап", file: imageFile(), type: "add" },
          { photo: c, type: "keep" },
          { alt: "Эскиз", photo: a, type: "updateAlt" },
        ],
      },
      onRowSaved,
    );

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "DELETE /api/about/process-photos/b",
      "POST /api/about/process-photos",
      "PATCH /api/about/process-photos/a",
      "PUT /api/about/process-photos/order",
    ]);
    expect(order).toEqual({ ids: ["new-1", "c", "a"] });
    expect(onRowSaved.mock.calls).toEqual([
      [0, apiProcessPhoto("new-1", "Новый этап")],
      [2, apiProcessPhoto("a", "Эскиз")],
    ]);
  });

  it("does not send the order when it did not change", async () => {
    const requests = recordRequests();

    await saveProcessPhotos(
      {
        deleted: [],
        isReordered: false,
        steps: [
          { photo: a, type: "keep" },
          { alt: "Этап b", file: imageFile(), photo: b, type: "replace" },
        ],
      },
      () => {},
    );

    expect(requests).toEqual(["GET /api/auth/csrf", "PUT /api/about/process-photos/b"]);
  });

  it("stops at the first request that fails, after reporting the rows saved before it", async () => {
    server.use(mswHttp.patch("/api/about/process-photos/a", () => problem(500)));
    const requests = recordRequests();
    const onRowSaved = vi.fn();

    const error = await saveProcessPhotos(
      {
        deleted: [],
        isReordered: true,
        steps: [
          { alt: "Новый этап", file: imageFile(), type: "add" },
          { alt: "Эскиз", photo: a, type: "updateAlt" },
          { alt: "Эскиз b", photo: b, type: "updateAlt" },
        ],
      },
      onRowSaved,
    ).catch((rejection: unknown) => rejection);

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "POST /api/about/process-photos",
      "PATCH /api/about/process-photos/a",
    ]);
    expect(onRowSaved.mock.calls).toEqual([[0, apiProcessPhoto("new-1", "Новый этап")]]);
    expect(error).toBeInstanceOf(SaveProcessPhotoError);
    expect(error).toMatchObject({ cause: new HttpError(500), fileName: "a.jpg" });
  });

  it("names the picked file of a failed upload", async () => {
    server.use(mswHttp.post("/api/about/process-photos", () => problem(409)));

    const error = await getSaveError({
      deleted: [],
      isReordered: false,
      steps: [{ alt: "Новый этап", file: imageFile("etude.png"), type: "add" }],
    });

    expect(error).toMatchObject({ fileName: "etude.png" });
  });

  it("does not save the rows when a photo was not deleted", async () => {
    server.use(mswHttp.delete("/api/about/process-photos/a", () => problem(500)));
    const requests = recordRequests();

    const error = await getSaveError({
      deleted: [a],
      isReordered: true,
      steps: [
        { photo: c, type: "keep" },
        { alt: "Эскиз", photo: b, type: "updateAlt" },
      ],
    });

    expect(requests).toEqual(["GET /api/auth/csrf", "DELETE /api/about/process-photos/a"]);
    expect(error).toMatchObject({ fileName: "a.jpg" });
  });

  it("names no photo when the order failed", async () => {
    server.use(mswHttp.put("/api/about/process-photos/order", () => problem(409)));

    const error = await getSaveError({
      deleted: [],
      isReordered: true,
      steps: [
        { photo: c, type: "keep" },
        { photo: b, type: "keep" },
        { photo: a, type: "keep" },
      ],
    });

    expect(error).toBeInstanceOf(SaveProcessPhotoError);
    expect(error).toMatchObject({ cause: new HttpError(409), fileName: undefined });
  });
});
