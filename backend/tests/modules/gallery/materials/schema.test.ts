import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { galleryMaterialsBodySchema, maxMaterials } from "#modules/gallery/materials/schema";

function material(title: string) {
  return { id: randomUUID(), title };
}

function issuesOf(materials: unknown): { message: string; path: PropertyKey[] }[] {
  const result = galleryMaterialsBodySchema.safeParse({ materials });

  return result.success ? [] : result.error.issues.map(({ message, path }) => ({ message, path }));
}

describe("gallery materials body", () => {
  it("trims the titles", () => {
    const watercolor = material("  Акварель ");

    expect(galleryMaterialsBodySchema.parse({ materials: [watercolor] })).toEqual({
      materials: [{ id: watercolor.id, title: "Акварель" }],
    });
  });

  it("takes no materials at all", () => {
    expect(issuesOf([])).toEqual([]);
  });

  it("needs a title of up to 50 characters", () => {
    expect(issuesOf([material("  ")])).toHaveLength(1);
    expect(issuesOf([material("a".repeat(50))])).toEqual([]);
    expect(issuesOf([material("a".repeat(51))])).toHaveLength(1);
  });

  it("needs a uuid for each material, used once", () => {
    const watercolor = material("Акварель");

    expect(issuesOf([{ ...watercolor, id: "watercolor" }])).toHaveLength(1);
    expect(issuesOf([watercolor, { ...material("Гуашь"), id: watercolor.id }])).toEqual([
      { message: "Each id must appear once", path: ["materials", 1, "id"] },
    ]);
  });

  it("points at a title used twice, whatever the case", () => {
    expect(issuesOf([material("Акварель"), material("АКВАРЕЛЬ")])).toEqual([
      { message: "Another material has this title", path: ["materials", 1, "title"] },
    ]);
  });

  it(`takes up to ${maxMaterials} materials`, () => {
    const materials = Array.from({ length: maxMaterials }, (_, index) => material(`${index}`));

    expect(issuesOf(materials)).toEqual([]);
    expect(issuesOf([...materials, material("ещё")])).toHaveLength(1);
  });

  it("rejects unknown fields", () => {
    expect(issuesOf([{ ...material("Акварель"), color: "blue" }])).toHaveLength(1);
  });
});
