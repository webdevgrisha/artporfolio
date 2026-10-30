import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import type { ProcessPhotosChanges } from "@/features/edit-about/model/processPhotosChanges";
import { saveProcessPhotos } from "@/features/edit-about/model/saveProcessPhotos";
import { sessionExpiredMessage } from "@/shared/api/getRequestErrorMessage";

import { csrfHandler, noContent, problem } from "../../../support/handlers";
import { apiProcessPhoto, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

const saved = [apiProcessPhoto("a"), apiProcessPhoto("b"), apiProcessPhoto("c")];

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

beforeEach(() => {
  server.use(csrfHandler, ...processPhotosApi());
});

describe("saveProcessPhotos", () => {
  it("deletes first, then saves the rows in order, then puts the photos in the new order", async () => {
    const requests = recordRequests();
    let order: { ids: string[] } | undefined;
    server.use(
      mswHttp.put("/api/about/process-photos/order", async ({ request }) => {
        order = (await request.json()) as { ids: string[] };
        return HttpResponse.json(order);
      }),
    );
    const changes: ProcessPhotosChanges = {
      deletedIds: ["b"],
      steps: [
        { alt: "Новый этап", file: imageFile(), type: "add" },
        { id: "c", type: "keep" },
        { alt: "Эскиз", id: "a", type: "updateAlt" },
      ],
    };

    const result = await saveProcessPhotos(changes, saved);

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "DELETE /api/about/process-photos/b",
      "POST /api/about/process-photos",
      "PATCH /api/about/process-photos/a",
      "PUT /api/about/process-photos/order",
    ]);
    expect(order).toEqual({ ids: ["new-1", "c", "a"] });
    expect(result).toEqual({
      error: undefined,
      photos: [apiProcessPhoto("new-1", "Новый этап"), saved[2], apiProcessPhoto("a", "Эскиз")],
      rows: [
        { alt: "Новый этап", file: null, photoId: "new-1", status: "saved" },
        { alt: "Этап c", file: null, photoId: "c", status: "saved" },
        { alt: "Эскиз", file: null, photoId: "a", status: "saved" },
      ],
    });
  });

  it("does not send the order when it did not change", async () => {
    const requests = recordRequests();

    const result = await saveProcessPhotos(
      {
        deletedIds: [],
        steps: [
          { id: "a", type: "keep" },
          { alt: "Этап b", file: imageFile(), id: "b", type: "replace" },
          { id: "c", type: "keep" },
          { alt: "Последний этап", file: imageFile(), type: "add" },
        ],
      },
      saved,
    );

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "PUT /api/about/process-photos/b",
      "POST /api/about/process-photos",
    ]);
    expect(result.photos.map((photo) => photo.id)).toEqual(["a", "b", "c", "new-1"]);
  });

  it("keeps the change of a failed row and saves the others", async () => {
    server.use(mswHttp.patch("/api/about/process-photos/a", () => problem(500)));
    const requests = recordRequests();
    const file = imageFile("etude.png");

    const result = await saveProcessPhotos(
      {
        deletedIds: [],
        steps: [
          { alt: "Эскиз", id: "a", type: "updateAlt" },
          { alt: "Новый этап", file, type: "add" },
          { id: "c", type: "keep" },
          { id: "b", type: "keep" },
        ],
      },
      saved,
    );

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "PATCH /api/about/process-photos/a",
      "POST /api/about/process-photos",
      "PUT /api/about/process-photos/order",
    ]);
    expect(result.error).toBe("Сервис временно недоступен. Попробуйте позже");
    expect(result.rows).toEqual([
      { alt: "Эскиз", file: null, photoId: "a", status: "saved" },
      { alt: "Новый этап", file: null, photoId: "new-1", status: "saved" },
      { alt: "Этап c", file: null, photoId: "c", status: "saved" },
      { alt: "Этап b", file: null, photoId: "b", status: "saved" },
    ]);
    expect(result.photos.map((photo) => photo.id)).toEqual(["a", "new-1", "c", "b"]);
  });

  it("leaves a new photo that was not uploaded out of the order", async () => {
    server.use(mswHttp.post("/api/about/process-photos", () => problem(409)));
    const file = imageFile("etude.png");

    const result = await saveProcessPhotos(
      {
        deletedIds: [],
        steps: [
          { alt: "Новый этап", file, type: "add" },
          { id: "b", type: "keep" },
          { id: "a", type: "keep" },
          { id: "c", type: "keep" },
        ],
      },
      saved,
    );

    expect(result.error).toBe("Фото «etude.png» не добавлено: фото уже максимум");
    expect(result.rows[0]).toEqual({ alt: "Новый этап", file, status: "new" });
    expect(result.photos.map((photo) => photo.id)).toEqual(["b", "a", "c"]);
  });

  it("does not send the order when a photo was not deleted: the server would refuse it", async () => {
    server.use(mswHttp.delete("/api/about/process-photos/a", () => problem(500)));
    const requests = recordRequests();

    const result = await saveProcessPhotos(
      {
        deletedIds: ["a"],
        steps: [
          { id: "c", type: "keep" },
          { id: "b", type: "keep" },
        ],
      },
      saved,
    );

    expect(requests).toEqual(["GET /api/auth/csrf", "DELETE /api/about/process-photos/a"]);
    expect(result.photos).toEqual(saved);
  });

  it("stops at an expired session and keeps every change that was not sent", async () => {
    server.use(mswHttp.delete("/api/about/process-photos/a", () => problem(401)));
    const requests = recordRequests();
    const file = imageFile();

    const result = await saveProcessPhotos(
      {
        deletedIds: ["a", "b"],
        steps: [
          { id: "c", type: "keep" },
          { alt: "Новый этап", file, type: "add" },
        ],
      },
      saved,
    );

    expect(requests).toEqual(["GET /api/auth/csrf", "DELETE /api/about/process-photos/a"]);
    expect(result).toEqual({
      error: sessionExpiredMessage,
      photos: saved,
      rows: [
        { alt: "Этап c", file: null, photoId: "c", status: "saved" },
        { alt: "Новый этап", file, status: "new" },
      ],
    });
  });

  it("says once a reason that several photos failed for", async () => {
    server.use(
      mswHttp.patch("/api/about/process-photos/:id", () => HttpResponse.error()),
      mswHttp.put("/api/about/process-photos/order", () => HttpResponse.error()),
    );

    const result = await saveProcessPhotos(
      {
        deletedIds: [],
        steps: [
          { alt: "Эскиз c", id: "c", type: "updateAlt" },
          { alt: "Эскиз b", id: "b", type: "updateAlt" },
          { id: "a", type: "keep" },
        ],
      },
      saved,
    );

    expect(result.error).toBe("Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз");
  });

  it("explains an order that the server refused", async () => {
    server.use(mswHttp.put("/api/about/process-photos/order", () => problem(409)));

    const result = await saveProcessPhotos(
      {
        deletedIds: [],
        steps: [
          { id: "c", type: "keep" },
          { id: "b", type: "keep" },
          { id: "a", type: "keep" },
        ],
      },
      saved,
    );

    expect(result.error).toBe(
      "Порядок фото не сохранён: фото на сервере изменились. Обновите страницу",
    );
    expect(result.photos).toEqual(saved);
  });
});
