import { HttpResponse, http as mswHttp } from "msw/http";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { getSitePages } from "@/entities/site-page/api/getSitePages";

import { apiImage } from "../../../support/images";
import { server } from "../../../support/server";

const signal = new AbortController().signal;

const pages = {
  about: { hero: null },
  contacts: { hero: null },
  gallery: { hero: null },
  home: { hero: apiImage() },
  projects: { hero: null },
};

describe("getSitePages", () => {
  it("reads the hero of every page", async () => {
    server.use(mswHttp.get("/api/pages", () => HttpResponse.json({ pages })));

    await expect(getSitePages({ signal })).resolves.toEqual(pages);
  });

  it("rejects a hero without any encoded file", async () => {
    const hero = { ...apiImage(), sources: { avif: [], webp: [] } };
    server.use(
      mswHttp.get("/api/pages", () => HttpResponse.json({ pages: { ...pages, home: { hero } } })),
    );

    await expect(getSitePages({ signal })).rejects.toBeInstanceOf(ZodError);
  });
});
