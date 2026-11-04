import { describe, expect, it } from "vitest";

import type { GalleryCollection } from "@/entities/gallery";
import {
  compareCollectionYears,
  matchesCollectionQuery,
} from "@/features/edit-gallery/model/collectionsTableView";

const collection = { title: "Ночные птицы" } as GalleryCollection;

describe("matchesCollectionQuery", () => {
  it("finds the query in the title, in any case, ignoring spaces around it", () => {
    expect(matchesCollectionQuery(collection, " ПТИЦ ")).toBe(true);
    expect(matchesCollectionQuery(collection, "саванна")).toBe(false);
  });

  it("matches every collection while the query is empty", () => {
    expect(matchesCollectionQuery(collection, "")).toBe(true);
  });
});

describe("compareCollectionYears", () => {
  const years = (startYear: number, endYear: number | null) =>
    ({ endYear, startYear }) as GalleryCollection;

  it("compares the years the collections were finished, then their starts", () => {
    // Both end in 2024: the one started earlier comes first.
    expect(compareCollectionYears(years(2020, 2024), years(2024, null))).toBeLessThan(0);
    expect(compareCollectionYears(years(2022, 2025), years(2024, 2025))).toBeLessThan(0);
    expect(compareCollectionYears(years(2025, null), years(2022, 2024))).toBeGreaterThan(0);
  });
});
