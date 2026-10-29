import { HttpResponse, http as mswHttp } from "msw/http";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { getContacts } from "@/entities/contacts/api/getContacts";

import { apiPhoto } from "../../../support/images";
import { server } from "../../../support/server";

const signal = new AbortController().signal;

const contacts = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "",
  youtube: "",
};

describe("getContacts", () => {
  it("reads the contacts with their photo, or without one", async () => {
    server.use(mswHttp.get("/api/contacts", () => HttpResponse.json({ contacts, photo: null })));
    await expect(getContacts({ signal })).resolves.toEqual({ contacts, photo: null });

    server.use(
      mswHttp.get("/api/contacts", () => HttpResponse.json({ contacts, photo: apiPhoto() })),
    );
    await expect(getContacts({ signal })).resolves.toEqual({ contacts, photo: apiPhoto() });
  });

  it("rejects contacts without a link field", async () => {
    const { youtube: _youtube, ...withoutYoutube } = contacts;
    server.use(
      mswHttp.get("/api/contacts", () =>
        HttpResponse.json({ contacts: withoutYoutube, photo: null }),
      ),
    );

    await expect(getContacts({ signal })).rejects.toBeInstanceOf(ZodError);
  });
});
