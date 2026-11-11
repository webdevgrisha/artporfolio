import { describe, expect, it } from "vitest";

import { longestWordLength } from "@/lib/text/longestWord";

describe("longestWordLength", () => {
  it("counts the letters of the longest word", () => {
    expect(longestWordLength("Get in touch")).toBe(5);
    expect(longestWordLength("Επικοινωνία")).toBe(11);
  });

  it("counts a letter written with several code points once", () => {
    expect(longestWordLength("Ia legătura")).toBe(8);
    expect(longestWordLength("Zv́azok")).toBe(6);
  });

  it("is zero for a text without words", () => {
    expect(longestWordLength("")).toBe(0);
  });
});
