import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { galleryColorsBodySchema, maxColors } from "#modules/gallery/colors/schema";

function color(title: string) {
  return { id: randomUUID(), title, hex: "#1f4e9c" };
}

function issuesOf(colors: unknown): { message: string; path: PropertyKey[] }[] {
  const result = galleryColorsBodySchema.safeParse({ colors });

  return result.success ? [] : result.error.issues.map(({ message, path }) => ({ message, path }));
}

describe("gallery colors body", () => {
  it("trims the titles", () => {
    const blue = color("  Синий ");

    expect(galleryColorsBodySchema.parse({ colors: [blue] })).toEqual({
      colors: [{ id: blue.id, title: "Синий", hex: "#1f4e9c" }],
    });
  });

  it("takes no colors at all", () => {
    expect(issuesOf([])).toEqual([]);
  });

  it("needs a title of up to 50 characters", () => {
    expect(issuesOf([color("  ")])).toHaveLength(1);
    expect(issuesOf([color("a".repeat(50))])).toEqual([]);
    expect(issuesOf([color("a".repeat(51))])).toHaveLength(1);
  });

  it("needs a swatch as #rrggbb and keeps it in lower case", () => {
    expect(issuesOf([{ ...color("Синий"), hex: undefined }])).toHaveLength(1);
    expect(issuesOf([{ ...color("Синий"), hex: "#1f4e9" }])).toHaveLength(1);
    expect(issuesOf([{ ...color("Синий"), hex: "blue" }])).toHaveLength(1);
    expect(
      galleryColorsBodySchema.parse({ colors: [{ ...color("Синий"), hex: "#1F4E9C" }] }),
    ).toMatchObject({ colors: [{ hex: "#1f4e9c" }] });
  });

  it("needs a uuid for each color, used once", () => {
    const blue = color("Синий");

    expect(issuesOf([{ ...blue, id: "blue-id" }])).toHaveLength(1);
    expect(issuesOf([blue, { ...color("Красный"), id: blue.id }])).toEqual([
      { message: "Each id must appear once", path: ["colors", 1, "id"] },
    ]);
  });

  it("points at a title used twice, whatever the case", () => {
    expect(issuesOf([color("Синий"), color("СИНИЙ")])).toEqual([
      { message: "Another color has this title", path: ["colors", 1, "title"] },
    ]);
  });

  it(`takes up to ${maxColors} colors`, () => {
    const colors = Array.from({ length: maxColors }, (_, index) => color(`${index}`));

    expect(issuesOf(colors)).toEqual([]);
    expect(issuesOf([...colors, color("ещё")])).toHaveLength(1);
  });

  it("rejects unknown fields", () => {
    expect(issuesOf([{ ...color("Синий"), shade: "dark" }])).toHaveLength(1);
  });
});
