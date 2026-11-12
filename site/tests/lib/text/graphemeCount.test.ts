import { describe, expect, it } from "vitest";

import { graphemeCount } from "@/lib/text/graphemeCount";

describe("graphemeCount", () => {
  it("counts the letters and the spaces of a text", () => {
    expect(graphemeCount("Tiếp theo")).toBe(9);
  });

  it("counts a letter written with several code points once", () => {
    expect(graphemeCount("Zv́azok")).toBe(6);
    expect(graphemeCount("अगला")).toBe(3);
  });

  it("is zero for an empty text", () => {
    expect(graphemeCount("")).toBe(0);
  });
});
