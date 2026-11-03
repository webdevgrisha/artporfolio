import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { galleryPalettesBodySchema, maxPalettes } from "#modules/gallery-palettes/schema";

function palette(title: string) {
  return { id: randomUUID(), title };
}

function issuesOf(palettes: unknown): { message: string; path: PropertyKey[] }[] {
  const result = galleryPalettesBodySchema.safeParse({ palettes });

  return result.success ? [] : result.error.issues.map(({ message, path }) => ({ message, path }));
}

describe("gallery palettes body", () => {
  it("trims the titles", () => {
    const pastel = palette("  Пастельная ");

    expect(galleryPalettesBodySchema.parse({ palettes: [pastel] })).toEqual({
      palettes: [{ id: pastel.id, title: "Пастельная" }],
    });
  });

  it("takes no palettes at all", () => {
    expect(issuesOf([])).toEqual([]);
  });

  it("needs a title of up to 50 characters", () => {
    expect(issuesOf([palette("  ")])).toHaveLength(1);
    expect(issuesOf([palette("a".repeat(50))])).toEqual([]);
    expect(issuesOf([palette("a".repeat(51))])).toHaveLength(1);
  });

  it("needs a uuid for each palette, used once", () => {
    const pastel = palette("Пастельная");

    expect(issuesOf([{ ...pastel, id: "pastel" }])).toHaveLength(1);
    expect(issuesOf([pastel, { ...palette("Яркая"), id: pastel.id }])).toEqual([
      { message: "Each id must appear once", path: ["palettes", 1, "id"] },
    ]);
  });

  it("points at a title used twice, whatever the case", () => {
    expect(issuesOf([palette("Пастельная"), palette("ПАСТЕЛЬНАЯ")])).toEqual([
      {
        message: "Another palette has this title",
        path: ["palettes", 1, "title"],
      },
    ]);
  });

  it(`takes up to ${maxPalettes} palettes`, () => {
    const palettes = Array.from({ length: maxPalettes }, (_, index) => palette(`${index}`));

    expect(issuesOf(palettes)).toEqual([]);
    expect(issuesOf([...palettes, palette("ещё")])).toHaveLength(1);
  });

  it("rejects unknown fields", () => {
    expect(issuesOf([{ ...palette("Пастельная"), color: "blue" }])).toHaveLength(1);
  });
});
