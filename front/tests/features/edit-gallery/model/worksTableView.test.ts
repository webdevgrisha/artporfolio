import { describe, expect, it } from "vitest";

import type { GalleryWork } from "@/entities/gallery";
import {
  compareWorkDates,
  compareWorkSizes,
  formatWorkPlace,
  matchesWorkQuery,
} from "@/features/edit-gallery/model/worksTableView";

const work = { title: "Слон на закате" } as GalleryWork;

describe("matchesWorkQuery", () => {
  it("finds the query in the title, in any case, ignoring spaces around it", () => {
    expect(matchesWorkQuery(work, " ЗАКАТ ")).toBe(true);
    expect(matchesWorkQuery(work, "тигр")).toBe(false);
  });

  it("matches every work while the query is empty", () => {
    expect(matchesWorkQuery(work, "")).toBe(true);
  });
});

describe("compareWorkSizes", () => {
  const sized = (width: number, height: number) => ({ size: { height, width } }) as GalleryWork;

  it("compares the areas, then the widths", () => {
    expect(compareWorkSizes(sized(30, 40), sized(50, 70))).toBeLessThan(0);
    // 100 × 70 is larger than 50 × 120 though narrower in height.
    expect(compareWorkSizes(sized(100, 70), sized(50, 120))).toBeGreaterThan(0);
    expect(compareWorkSizes(sized(40, 30), sized(30, 40))).toBeGreaterThan(0);
    expect(compareWorkSizes(sized(30, 40), sized(30, 40))).toBe(0);
  });
});

describe("compareWorkDates", () => {
  const dated = (year: number, month: number) => ({ month, year }) as GalleryWork;

  it("compares the years, then the months", () => {
    expect(compareWorkDates(dated(2023, 12), dated(2024, 1))).toBeLessThan(0);
    expect(compareWorkDates(dated(2024, 5), dated(2024, 3))).toBeGreaterThan(0);
    expect(compareWorkDates(dated(2024, 5), dated(2024, 5))).toBe(0);
  });
});

describe("formatWorkPlace", () => {
  const placed = (country: string | null, city: string) => ({ city, country }) as GalleryWork;

  it("names the country in Russian, then the city", () => {
    expect(formatWorkPlace(placed("PL", "Краков"))).toBe("Польша, Краков");
  });

  it("leaves out the part that isn't given", () => {
    expect(formatWorkPlace(placed("PL", ""))).toBe("Польша");
    expect(formatWorkPlace(placed(null, "Краков"))).toBe("Краков");
    expect(formatWorkPlace(placed(null, ""))).toBe("");
  });
});
