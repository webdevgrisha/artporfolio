import { describe, expect, it } from "vitest";

import type {
  GalleryCollection,
  GalleryMaterial,
  GallerySection,
  GalleryWorkSummary,
} from "@/entities/gallery";
import {
  compareWorkDates,
  compareWorkSizes,
  createWorkFilters,
  formatWorkPlace,
  matchesWorkQuery,
} from "@/features/edit-gallery/work/model/worksTableView";

const work = { title: "Слон на закате" } as GalleryWorkSummary;

describe("matchesWorkQuery", () => {
  it("finds the query in the title, in any case, ignoring spaces around it", () => {
    expect(matchesWorkQuery(work, " ЗАКАТ ")).toBe(true);
    expect(matchesWorkQuery(work, "тигр")).toBe(false);
  });

  it("matches every work while the query is empty", () => {
    expect(matchesWorkQuery(work, "")).toBe(true);
  });
});

describe("createWorkFilters", () => {
  const collections = [{ id: "c1", title: "Звери" }] as GalleryCollection[];
  const materials = [{ id: "m1", title: "Масло" }] as GalleryMaterial[];
  const sections = [
    { id: "s1", subsections: [{ id: "s1a", title: "Пейзаж" }], title: "Живопись" },
    { id: "s2", subsections: [], title: "Постеры" },
  ] as GallerySection[];
  const filters = createWorkFilters(collections, materials, sections);

  function fits(id: string, fields: Partial<GalleryWorkSummary>, value: string): boolean {
    const filter = filters.find((candidate) => candidate.id === id);

    return filter?.matches(fields as GalleryWorkSummary, value) ?? false;
  }

  it("finds the works of a section and of its subsections", () => {
    expect(fits("section", { sectionIds: ["s1"] }, "s1")).toBe(true);
    expect(fits("section", { sectionIds: ["s1a"] }, "s1")).toBe(true);
    expect(fits("section", { sectionIds: ["s2"] }, "s1")).toBe(false);
  });

  it("finds only the works of a subsection, not those of its section", () => {
    expect(fits("section", { sectionIds: ["s1a"] }, "s1a")).toBe(true);
    expect(fits("section", { sectionIds: ["s1"] }, "s1a")).toBe(false);
  });

  it("finds the works of a collection and the works on their own", () => {
    const none = filters
      .find(({ id }) => id === "collection")
      ?.options.find(({ label }) => label === "Без коллекции");

    expect(none?.value).toBeTruthy();
    expect(fits("collection", { collectionId: "c1" }, "c1")).toBe(true);
    expect(fits("collection", { collectionId: null }, "c1")).toBe(false);
    expect(fits("collection", { collectionId: null }, none?.value ?? "")).toBe(true);
    expect(fits("collection", { collectionId: "c1" }, none?.value ?? "")).toBe(false);
  });

  it("finds the works by their status and their material", () => {
    expect(fits("status", { saleStatus: "sold" }, "sold")).toBe(true);
    expect(fits("status", { saleStatus: "available" }, "sold")).toBe(false);
    expect(fits("material", { materialIds: ["m1"] }, "m1")).toBe(true);
    expect(fits("material", { materialIds: [] }, "m1")).toBe(false);
  });
});

describe("compareWorkSizes", () => {
  const sized = (width: number, height: number) =>
    ({ size: { height, width } }) as GalleryWorkSummary;

  it("compares the areas, then the widths", () => {
    expect(compareWorkSizes(sized(30, 40), sized(50, 70))).toBeLessThan(0);
    // 100 × 70 is larger than 50 × 120 though narrower in height.
    expect(compareWorkSizes(sized(100, 70), sized(50, 120))).toBeGreaterThan(0);
    expect(compareWorkSizes(sized(40, 30), sized(30, 40))).toBeGreaterThan(0);
    expect(compareWorkSizes(sized(30, 40), sized(30, 40))).toBe(0);
  });
});

describe("compareWorkDates", () => {
  const dated = (year: number, month: number) => ({ month, year }) as GalleryWorkSummary;

  it("compares the years, then the months", () => {
    expect(compareWorkDates(dated(2023, 12), dated(2024, 1))).toBeLessThan(0);
    expect(compareWorkDates(dated(2024, 5), dated(2024, 3))).toBeGreaterThan(0);
    expect(compareWorkDates(dated(2024, 5), dated(2024, 5))).toBe(0);
  });
});

describe("formatWorkPlace", () => {
  const placed = (country: string | null, city: string) =>
    ({ city, country }) as GalleryWorkSummary;

  it("names the country in Russian, then the city", () => {
    expect(formatWorkPlace(placed("PL", "Краков"))).toBe("Польша, Краков");
  });

  it("leaves out the part that isn't given", () => {
    expect(formatWorkPlace(placed("PL", ""))).toBe("Польша");
    expect(formatWorkPlace(placed(null, "Краков"))).toBe("Краков");
    expect(formatWorkPlace(placed(null, ""))).toBe("");
  });
});
