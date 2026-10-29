import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import type { AboutText } from "@/entities/about";
import { saveAbout } from "@/features/edit-about/model/saveAbout";
import { sessionExpiredMessage } from "@/shared/api/getRequestErrorMessage";

import { csrfHandler, csrfToken, noContent, problem } from "../../../support/handlers";
import { apiPhoto, apiProcessPhoto, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

const text: AboutText = { about: "Художница", biography: "Родилась…", creation: "Пишу маслом" };
const savedProcessPhotos = [apiProcessPhoto("a"), apiProcessPhoto("b")];

beforeEach(() => {
  server.use(
    csrfHandler,
    mswHttp.put("/api/about", async ({ request }) =>
      HttpResponse.json({ text: await request.json() }),
    ),
    mswHttp.put("/api/about/photo", async ({ request }) => {
      const alt = String((await request.formData()).get("alt"));
      return HttpResponse.json({ photo: apiPhoto(alt) });
    }),
    mswHttp.patch("/api/about/photo", async ({ request }) => {
      const { alt } = (await request.json()) as { alt: string };
      return HttpResponse.json({ photo: apiPhoto(alt) });
    }),
    mswHttp.delete("/api/about/photo", () => noContent()),
    mswHttp.delete("/api/about/process-photos/:id", () => noContent()),
  );
});

describe("saveAbout", () => {
  it("saves each changed part with one CSRF token", async () => {
    const requests = recordRequests();
    const tokens = new Set<string | null>();
    server.events.on("request:start", ({ request }) => {
      if (request.method !== "GET") tokens.add(request.headers.get("X-CSRF-Token"));
    });

    const result = await saveAbout(
      {
        photo: { alt: "Портрет", file: imageFile(), type: "upload" },
        processPhotos: { deletedIds: ["a"], steps: [{ id: "b", type: "keep" }] },
        text,
      },
      savedProcessPhotos,
    );

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "PUT /api/about",
      "PUT /api/about/photo",
      "DELETE /api/about/process-photos/a",
    ]);
    expect(tokens).toEqual(new Set([csrfToken]));
    expect(result).toEqual({
      error: undefined,
      photoSaved: true,
      processPhotos: {
        error: undefined,
        photos: [savedProcessPhotos[1]],
        rows: [{ alt: "Этап b", file: null, photoId: "b", status: "saved" }],
      },
      textSaved: true,
    });
  });

  it("reports only the parts that were changed as saved", async () => {
    const result = await saveAbout({ photo: { type: "delete" } }, savedProcessPhotos);

    expect(result).toEqual({
      error: undefined,
      photoSaved: true,
      processPhotos: undefined,
      textSaved: false,
    });
  });

  it("keeps the saved parts when another one fails", async () => {
    server.use(mswHttp.put("/api/about", () => problem(400)));

    const result = await saveAbout(
      { photo: { alt: "Портрет", type: "updateAlt" }, text },
      savedProcessPhotos,
    );

    expect(result).toEqual({
      error: "Сервер не принял тексты. Проверьте их и попробуйте ещё раз",
      photoSaved: true,
      processPhotos: undefined,
      textSaved: false,
    });
  });

  it("says once a reason that several parts failed for", async () => {
    server.use(
      mswHttp.put("/api/about", () => problem(401)),
      mswHttp.delete("/api/about/photo", () => problem(401)),
      mswHttp.delete("/api/about/process-photos/:id", () => problem(401)),
    );

    const result = await saveAbout(
      {
        photo: { type: "delete" },
        processPhotos: { deletedIds: ["a"], steps: [{ id: "b", type: "keep" }] },
        text,
      },
      savedProcessPhotos,
    );

    expect(result.error).toBe(sessionExpiredMessage);
    expect(result.textSaved).toBe(false);
    expect(result.photoSaved).toBe(false);
    expect(result.processPhotos?.photos).toEqual(savedProcessPhotos);
  });

  it("sends nothing when the CSRF token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => problem(503)));
    const requests = recordRequests();

    const result = await saveAbout({ text }, savedProcessPhotos);

    expect(requests).toEqual(["GET /api/auth/csrf"]);
    expect(result).toEqual({
      error: "Сервис временно недоступен. Попробуйте позже",
      photoSaved: false,
      textSaved: false,
    });
  });
});
