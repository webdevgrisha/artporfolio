import { describe, expect, it } from "vitest";

import { titlesOf, toTitleOptions } from "@/features/edit-gallery/model/workReferences";

const materials = [
  { id: "watercolor", title: "Акварель" },
  { id: "oil", title: "Масло" },
  { id: "canvas", title: "Холст" },
];

describe("toTitleOptions", () => {
  it("offers the items by title, in the order of the list", () => {
    expect(toTitleOptions(materials)).toEqual([
      { label: "Акварель", value: "watercolor" },
      { label: "Масло", value: "oil" },
      { label: "Холст", value: "canvas" },
    ]);
  });
});

describe("titlesOf", () => {
  it("names the items in the order of the work and skips deleted ones", () => {
    expect(titlesOf(["canvas", "deleted", "oil"], materials)).toEqual(["Холст", "Масло"]);
  });
});
