import { describe, expect, it } from "vitest";

import { compareText } from "@/shared/lib/compareText";
import { containsText } from "@/shared/lib/containsText";
import { pluralForm } from "@/shared/lib/pluralForm";

describe("compareText", () => {
  it("orders by the Russian alphabet, whatever the case", () => {
    expect(["Яблоко", "акварель", "Ёлка"].sort(compareText)).toEqual([
      "акварель",
      "Ёлка",
      "Яблоко",
    ]);
    expect(compareText("Слон", "слон")).toBe(0);
  });
});

describe("containsText", () => {
  it("finds the query in any case, without the spaces around it", () => {
    expect(containsText("Слон на закате", "  ЗАКАТ ")).toBe(true);
    expect(containsText("Слон на закате", "тигр")).toBe(false);
  });
});

describe("pluralForm", () => {
  it.each([
    [1, "работа"],
    [3, "работы"],
    [5, "работ"],
    [21, "работа"],
  ])("takes the form for %d", (count, form) => {
    expect(pluralForm(count, "работа", "работы", "работ")).toBe(form);
  });
});
