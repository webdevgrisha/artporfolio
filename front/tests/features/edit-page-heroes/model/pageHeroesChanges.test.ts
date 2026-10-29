import { describe, expect, it } from "vitest";

import type { SitePages } from "@/entities/site-page";
import { getPageHeroesChanges } from "@/features/edit-page-heroes/model/pageHeroesChanges";
import { toPageHeroesFormValues } from "@/features/edit-page-heroes/model/pageHeroesFormValues";

import { apiImage, imageFile } from "../../../support/images";

const pages: SitePages = {
  about: { hero: apiImage() },
  contacts: { hero: null },
  gallery: { hero: apiImage() },
  home: { hero: apiImage() },
  projects: { hero: null },
};

const values = toPageHeroesFormValues(pages);

describe("getPageHeroesChanges", () => {
  it("is empty when nothing was changed", () => {
    expect(values).toEqual({
      about: "saved",
      contacts: null,
      gallery: "saved",
      home: "saved",
      projects: null,
    });
    expect(getPageHeroesChanges(values, pages)).toEqual({});
  });

  it("uploads a picked file, also in place of a saved hero", () => {
    const home = imageFile("home.png");
    const projects = imageFile("projects.png");

    expect(getPageHeroesChanges({ ...values, home, projects }, pages)).toEqual({
      home: { file: home, type: "upload" },
      projects: { file: projects, type: "upload" },
    });
  });

  it("deletes a removed hero, and only one that is on the server", () => {
    expect(getPageHeroesChanges({ ...values, contacts: null, gallery: null }, pages)).toEqual({
      gallery: { type: "delete" },
    });
  });
});
