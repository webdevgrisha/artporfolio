import { describe, expect, it } from "vitest";

import { materialsFormSchema } from "@/features/edit-gallery/model/materialsFormSchema";
import { sectionFormSchema } from "@/features/edit-gallery/model/sectionFormSchema";

function row(title: string, index: number) {
  return { id: `id-${String(index)}`, title };
}

function issuesOf(result: {
  success: boolean;
  error?: { issues: { message: string; path: PropertyKey[] }[] };
}) {
  return result.success
    ? []
    : (result.error?.issues ?? []).map(({ message, path }) => ({ message, path }));
}

describe("section form", () => {
  it("trims the titles and takes a section without subsections", () => {
    expect(sectionFormSchema.parse({ subsections: [], title: "  Графика " })).toEqual({
      subsections: [],
      title: "Графика",
    });
  });

  it("needs a title for the section and for each subsection", () => {
    expect(
      issuesOf(sectionFormSchema.safeParse({ subsections: [row(" ", 0)], title: "" })),
    ).toEqual([
      { message: "Введите название", path: ["title"] },
      { message: "Введите название", path: ["subsections", 0, "title"] },
    ]);
  });

  it("points at a subsection title used twice, whatever the case and spaces", () => {
    const subsections = ["Театральные", " театральные "].map(row);

    expect(issuesOf(sectionFormSchema.safeParse({ subsections, title: "Постеры" }))).toEqual([
      { message: "Такой подраздел уже есть", path: ["subsections", 1, "title"] },
    ]);
  });
});

describe("materials form", () => {
  it("takes no materials at all", () => {
    expect(materialsFormSchema.safeParse({ materials: [] }).success).toBe(true);
  });

  it("points at a material used twice and at an empty title", () => {
    const materials = ["Акварель", "", "АКВАРЕЛЬ"].map(row);

    expect(issuesOf(materialsFormSchema.safeParse({ materials }))).toEqual([
      { message: "Введите название", path: ["materials", 1, "title"] },
      { message: "Такой материал уже есть", path: ["materials", 2, "title"] },
    ]);
  });
});
