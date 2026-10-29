import { HttpResponse, http as mswHttp } from "msw/http";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { getAbout } from "@/entities/about/api/getAbout";

import { apiPhoto, apiProcessPhoto } from "../../../support/images";
import { server } from "../../../support/server";

const signal = new AbortController().signal;

describe("getAbout", () => {
  it("reads the page before anything is saved", async () => {
    server.use(
      mswHttp.get("/api/about", () =>
        HttpResponse.json({ photo: null, processPhotos: [], text: null }),
      ),
    );

    await expect(getAbout({ signal })).resolves.toEqual({
      photo: null,
      processPhotos: [],
      text: null,
    });
  });

  it("reads the texts and the photos", async () => {
    const about = {
      photo: apiPhoto(),
      processPhotos: [apiProcessPhoto("a"), apiProcessPhoto("b")],
      text: { about: "Художница", biography: "", creation: "" },
    };
    server.use(mswHttp.get("/api/about", () => HttpResponse.json(about)));

    await expect(getAbout({ signal })).resolves.toEqual(about);
  });

  it("rejects a photo without a description", async () => {
    const { alt: _alt, ...photo } = apiPhoto();
    server.use(
      mswHttp.get("/api/about", () => HttpResponse.json({ photo, processPhotos: [], text: null })),
    );

    await expect(getAbout({ signal })).rejects.toBeInstanceOf(ZodError);
  });
});
