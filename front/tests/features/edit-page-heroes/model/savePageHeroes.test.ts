import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import { savePageHeroes } from "@/features/edit-page-heroes/model/savePageHeroes";
import { sessionExpiredMessage } from "@/shared/api/requestErrorMessages";

import { csrfHandler, noContent, problem } from "../../../support/handlers";
import { apiImage, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

beforeEach(() => {
  server.use(
    csrfHandler,
    mswHttp.put("/api/pages/:page/hero", () => HttpResponse.json({ hero: apiImage() })),
    mswHttp.delete("/api/pages/:page/hero", () => noContent()),
  );
});

describe("savePageHeroes", () => {
  it("saves the changed pages one at a time, in the order of the form", async () => {
    const requests = recordRequests();

    const result = await savePageHeroes({
      about: { type: "delete" },
      contacts: { file: imageFile(), type: "upload" },
      home: { file: imageFile(), type: "upload" },
    });

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "PUT /api/pages/home/hero",
      "PUT /api/pages/contacts/hero",
      "DELETE /api/pages/about/hero",
    ]);
    expect(result).toEqual({ error: undefined, savedPages: ["home", "contacts", "about"] });
  });

  it("saves the other pages when one fails", async () => {
    server.use(mswHttp.put("/api/pages/home/hero", () => problem(413)));

    const result = await savePageHeroes({
      gallery: { type: "delete" },
      home: { file: imageFile(), type: "upload" },
    });

    expect(result).toEqual({
      error: "Фото страницы «Главная» больше 15 МБ",
      savedPages: ["gallery"],
    });
  });

  it("stops at an expired session", async () => {
    server.use(mswHttp.put("/api/pages/home/hero", () => problem(401)));
    const requests = recordRequests();

    const result = await savePageHeroes({
      gallery: { type: "delete" },
      home: { file: imageFile(), type: "upload" },
    });

    expect(requests).toEqual(["GET /api/auth/csrf", "PUT /api/pages/home/hero"]);
    expect(result).toEqual({ error: sessionExpiredMessage, savedPages: [] });
  });

  it("sends nothing when the CSRF token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error()));
    const requests = recordRequests();

    const result = await savePageHeroes({ home: { type: "delete" } });

    expect(requests).toEqual(["GET /api/auth/csrf"]);
    expect(result).toEqual({
      error: "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз",
      savedPages: [],
    });
  });
});
