import { describe, expect, it } from "vitest";

import { ownGroups, usageByItem } from "#modules/gallery-works/usage";

describe("usageByItem", () => {
  const groups = ownGroups(new Set(["oil", "canvas", "paper"]));

  it("counts the works that name each item, and those that name nothing else", () => {
    expect(usageByItem([["oil", "canvas"], ["oil"], ["paper"]], groups)).toEqual({
      canvas: { count: 1, onlyCount: 0 },
      oil: { count: 2, onlyCount: 1 },
      paper: { count: 1, onlyCount: 1 },
    });
  });

  it("ignores an id that is not in the list", () => {
    expect(usageByItem([["oil", "deleted"]], groups).oil).toEqual({ count: 1, onlyCount: 1 });
  });

  it("counts a work once for an item that covers several of its ids", () => {
    const sections = new Map([
      ["animals", new Set(["animals", "birds", "cats"])],
      ["birds", new Set(["birds"])],
      ["cats", new Set(["cats"])],
      ["plants", new Set(["plants"])],
    ]);

    expect(
      usageByItem(
        [
          ["birds", "cats"],
          ["birds", "plants"],
        ],
        sections,
      ),
    ).toEqual({
      animals: { count: 2, onlyCount: 1 },
      birds: { count: 2, onlyCount: 0 },
      cats: { count: 1, onlyCount: 0 },
      plants: { count: 1, onlyCount: 0 },
    });
  });
});
