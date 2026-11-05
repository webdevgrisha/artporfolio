import { describe, expect, it } from "vitest";

import { addableWorks } from "@/features/edit-gallery/collection/model/addableWorks";

const works = [
  { collectionId: null, id: "free" },
  { collectionId: "this", id: "own" },
  { collectionId: "other", id: "taken" },
];

function ids(chosenIds: string[], collectionId?: string): string[] {
  return addableWorks(works, chosenIds, collectionId).map((work) => work.id);
}

describe("addableWorks", () => {
  it("offers a free work, and an own one taken out of the form", () => {
    expect(ids([], "this")).toEqual(["free", "own"]);
  });

  it("leaves out the works already chosen", () => {
    expect(ids(["free", "own"], "this")).toEqual([]);
  });

  it("never offers a work of another collection", () => {
    expect(ids([])).toEqual(["free"]);
  });
});
