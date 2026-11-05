import { describe, expect, it } from "vitest";

import { byTitle, findRepeats, titleKey } from "#shared/text/titles";

describe("titles", () => {
  it("compares titles whatever the case", () => {
    expect(titleKey("ГРАФИКА")).toBe(titleKey("графика"));
  });

  it("sorts by the Russian alphabet, with ё after е", () => {
    const titles = ["Живопись", "Ёлка", "Евро", "акварель"].map((title) => ({ title }));

    expect(titles.toSorted(byTitle).map(({ title }) => title)).toEqual([
      "акварель",
      "Евро",
      "Ёлка",
      "Живопись",
    ]);
  });

  it("finds every id and title that repeats an earlier one", () => {
    expect(
      findRepeats([
        { id: "a", title: "Акварель" },
        { id: "b", title: "акварель" },
        { id: "a", title: "Гуашь" },
        { id: "c", title: "Масло" },
      ]),
    ).toEqual([
      { field: "title", index: 1 },
      { field: "id", index: 2 },
    ]);
  });
});
