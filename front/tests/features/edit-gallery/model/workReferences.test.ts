import { describe, expect, it } from "vitest";

import {
  titlesOf,
  toCollectionOptions,
  toTitleOptions,
} from "@/features/edit-gallery/model/workReferences";

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

describe("toCollectionOptions", () => {
  it("offers no collection first, then the collections by title", () => {
    expect(
      toCollectionOptions([
        { id: "sea", title: "Море" },
        { id: "savanna", title: "Саванна" },
        { id: "birds", title: "Ночные птицы" },
      ]),
    ).toEqual([
      { label: "Без коллекции", value: "" },
      { label: "Море", value: "sea" },
      { label: "Ночные птицы", value: "birds" },
      { label: "Саванна", value: "savanna" },
    ]);
  });
});
