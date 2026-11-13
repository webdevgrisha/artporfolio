import { describe, expect, it } from "vitest";

import { paragraphs } from "@/lib/text/paragraphs";

describe("paragraphs", () => {
  it("splits a text at its empty lines", () => {
    expect(paragraphs("First.\n\nSecond.\n\n\nThird.")).toEqual(["First.", "Second.", "Third."]);
  });

  it("takes a line of spaces or line breaks of Windows as empty", () => {
    expect(paragraphs("First.\r\n  \r\nSecond.")).toEqual(["First.", "Second."]);
  });

  it("keeps a single line break within its paragraph", () => {
    expect(paragraphs("A line,\nand the next.")).toEqual(["A line,\nand the next."]);
  });

  it("has no paragraphs in an empty text", () => {
    expect(paragraphs(" \n\n ")).toEqual([]);
  });
});
