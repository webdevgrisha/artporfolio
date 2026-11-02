import { describe, expect, it } from "vitest";

import { matchesSectionQuery } from "@/features/edit-gallery/model/sectionsSearch";

const posters = {
  id: "posters",
  subsections: [{ id: "theatre", title: "Театральные" }],
  title: "Постеры",
};

describe("matchesSectionQuery", () => {
  it("finds a section by its title or a subsection title, in any case", () => {
    expect(matchesSectionQuery(posters, "пост")).toBe(true);
    expect(matchesSectionQuery(posters, "ТЕАТР")).toBe(true);
    expect(matchesSectionQuery(posters, "  театр ")).toBe(true);
  });

  it("finds every section by an empty query and none by an unknown one", () => {
    expect(matchesSectionQuery(posters, "")).toBe(true);
    expect(matchesSectionQuery(posters, "живопись")).toBe(false);
  });
});
