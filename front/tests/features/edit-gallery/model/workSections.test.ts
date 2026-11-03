import { describe, expect, it } from "vitest";

import type { GallerySection } from "@/entities/gallery";
import { sectionLabels, toSectionOptions } from "@/features/edit-gallery/model/workSections";

const sections: GallerySection[] = [
  { id: "graphics", subsections: [], title: "Графика" },
  {
    id: "painting",
    subsections: [
      { id: "landscape", title: "Пейзаж" },
      { id: "portrait", title: "Портрет" },
    ],
    title: "Живопись",
  },
];

describe("toSectionOptions", () => {
  it("lists each section followed by its subsections, named with their section", () => {
    expect(toSectionOptions(sections)).toEqual([
      { label: "Графика", value: "graphics" },
      { label: "Живопись", value: "painting" },
      { label: "Живопись › Пейзаж", value: "landscape" },
      { label: "Живопись › Портрет", value: "portrait" },
    ]);
  });
});

describe("sectionLabels", () => {
  it("names the sections in the order of the work and skips deleted ones", () => {
    expect(sectionLabels(["portrait", "deleted", "graphics"], sections)).toEqual([
      "Живопись › Портрет",
      "Графика",
    ]);
  });
});
