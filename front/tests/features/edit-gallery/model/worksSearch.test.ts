import { describe, expect, it } from "vitest";

import type { GalleryWork } from "@/entities/gallery";
import { matchesWorkQuery } from "@/features/edit-gallery/model/worksSearch";

const work = { title: "Слон на закате" } as GalleryWork;

describe("matchesWorkQuery", () => {
  it("finds the query in the title, in any case, ignoring spaces around it", () => {
    expect(matchesWorkQuery(work, " ЗАКАТ ")).toBe(true);
    expect(matchesWorkQuery(work, "тигр")).toBe(false);
  });

  it("matches every work while the query is empty", () => {
    expect(matchesWorkQuery(work, "")).toBe(true);
  });
});
