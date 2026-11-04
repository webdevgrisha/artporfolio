import { describe, expect, it } from "vitest";

import type { GalleryCollection } from "@/entities/gallery";
import { matchesCollectionQuery } from "@/features/edit-gallery/model/collectionsSearch";

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
