import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import type { Contacts } from "@/entities/contacts";
import { saveContacts } from "@/features/edit-contacts/model/saveContacts";

import { csrfHandler, csrfToken, noContent, problem } from "../../../support/handlers";
import { apiPhoto, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

const contacts: Contacts = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

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
    mswHttp.put("/api/contacts", async ({ request }) => {
      const body = await request.json();
      receive(request, body);
      return HttpResponse.json({ contacts: body });
    }),
    mswHttp.put("/api/contacts/photo", async ({ request }) => {
      const formData = await request.formData();
      const body = { alt: formData.get("alt"), file: formData.get("file") };
      receive(request, body);
      return HttpResponse.json({ photo: apiPhoto(String(body.alt)) });
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

describe("saveContacts", () => {
  it("saves the links and uploads the photo with the CSRF token", async () => {
    const file = imageFile();

    const result = await saveContacts({
      contacts,
      photo: { alt: "Портрет", file, type: "upload" },
    });

    expect(result).toEqual({ error: undefined, linksSaved: true, photoSaved: true });
    expect(received).toEqual({
      "PUT /api/contacts": { body: contacts, token: csrfToken },
      "PUT /api/contacts/photo": {
        body: { alt: "Портрет", file: expect.any(File) },
        token: csrfToken,
      },
    });
  });

  it("updates only the description of the photo", async () => {
    const result = await saveContacts({ photo: { alt: "Автопортрет", type: "updateAlt" } });

    expect(result).toEqual({ error: undefined, linksSaved: false, photoSaved: true });
    expect(received).toEqual({
      "PATCH /api/contacts/photo": { body: { alt: "Автопортрет" }, token: csrfToken },
    });
  });

  it("deletes the photo", async () => {
    const result = await saveContacts({ photo: { type: "delete" } });

    expect(result).toEqual({ error: undefined, linksSaved: false, photoSaved: true });
    expect(received).toEqual({ "DELETE /api/contacts/photo": { body: null, token: csrfToken } });
  });

  it("keeps the saved part when the other one fails", async () => {
    server.use(mswHttp.put("/api/contacts", () => problem(400)));

    const result = await saveContacts({ contacts, photo: { type: "delete" } });

    expect(result).toEqual({
      error: "Сервер не принял ссылки. Проверьте их и попробуйте ещё раз",
      linksSaved: false,
      photoSaved: true,
    });
  });

  it("says each reason once", async () => {
    server.use(
      mswHttp.put("/api/contacts", () => problem(503)),
      mswHttp.delete("/api/contacts/photo", () => problem(503)),
    );

    const result = await saveContacts({ contacts, photo: { type: "delete" } });

    expect(result).toEqual({
      error: "Сервис временно недоступен. Попробуйте позже",
      linksSaved: false,
      photoSaved: false,
    });
  });

  it("joins different reasons", async () => {
    server.use(
      mswHttp.put("/api/contacts", () => problem(400)),
      mswHttp.patch("/api/contacts/photo", () => problem(404)),
    );

    const result = await saveContacts({ contacts, photo: { alt: "Портрет", type: "updateAlt" } });

    expect(result.error).toBe(
      "Сервер не принял ссылки. Проверьте их и попробуйте ещё раз. " +
        "Фото уже удалено. Обновите страницу",
    );
  });

  it("sends nothing when the CSRF token was not received", async () => {
    server.use(mswHttp.get("/api/auth/csrf", () => HttpResponse.error()));
    const requests = recordRequests();

    const result = await saveContacts({ contacts });

    expect(requests).toEqual(["GET /api/auth/csrf"]);
    expect(result).toEqual({
      error: "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз",
      linksSaved: false,
      photoSaved: false,
    });
  });
});
