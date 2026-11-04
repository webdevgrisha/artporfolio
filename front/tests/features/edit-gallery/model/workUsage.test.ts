import { describe, expect, it } from "vitest";

import {
  describeWorkUsage,
  formatWorkCount,
  workUsage,
  workUsageById,
} from "@/features/edit-gallery/model/workUsage";

const names = { item: "материал", others: "материалов" };

describe("workUsage", () => {
  it("counts the works that name any of the items, and those that name nothing else", () => {
    const works = [["oil"], ["oil", "canvas"], ["canvas"], ["watercolor", "paper"]];

    expect(workUsage(works, new Set(["oil"]))).toEqual({ count: 2, onlyCount: 1 });
    expect(workUsage(works, new Set(["oil", "canvas"]))).toEqual({ count: 3, onlyCount: 3 });
    expect(workUsage(works, new Set(["gouache"]))).toEqual({ count: 0, onlyCount: 0 });
  });
});

describe("workUsageById", () => {
  it("counts the works of each item, as workUsage does for one", () => {
    const usages = workUsageById([["oil"], ["oil", "canvas"], ["canvas"]]);

    expect(usages.get("oil")).toEqual({ count: 2, onlyCount: 1 });
    expect(usages.get("canvas")).toEqual({ count: 2, onlyCount: 1 });
    expect(usages.get("gouache")).toBeUndefined();
  });
});

describe("formatWorkCount", () => {
  it("agrees the word with the number", () => {
    expect(formatWorkCount(1)).toBe("1 работа");
    expect(formatWorkCount(3)).toBe("3 работы");
    expect(formatWorkCount(12)).toBe("12 работ");
    expect(formatWorkCount(21)).toBe("21 работа");
  });
});

describe("describeWorkUsage", () => {
  it("only counts the works when each of them has other items", () => {
    expect(describeWorkUsage({ count: 21, onlyCount: 0 }, names)).toBe("Есть у 21 работы.");
    expect(describeWorkUsage({ count: 12, onlyCount: 0 }, names)).toBe("Есть у 12 работ.");
  });

  it("warns about the works left with none of the items", () => {
    expect(describeWorkUsage({ count: 12, onlyCount: 2 }, names)).toBe(
      "Есть у 12 работ. У 2 из них других материалов нет — их не получится сохранить, пока не выберете им материал.",
    );
    expect(describeWorkUsage({ count: 3, onlyCount: 3 }, names)).toBe(
      "Есть у 3 работ. Других материалов у них нет — их не получится сохранить, пока не выберете им материал.",
    );
    expect(describeWorkUsage({ count: 1, onlyCount: 1 }, names)).toBe(
      "Есть у 1 работы. Других материалов у неё нет — её не получится сохранить, пока не выберете ей материал.",
    );
  });
});
