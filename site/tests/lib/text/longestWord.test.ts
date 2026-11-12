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

  it("counts words joined by a no-break space as one, as they share a line", () => {
    expect(longestWordLength("Свяжитесь со\u00A0мной")).toBe(9);
    expect(longestWordLength("Napisz do\u00A0mnie teraz")).toBe(7);
  });

  it("is zero for a text without words", () => {
    expect(longestWordLength("")).toBe(0);
  });
});
