import { describe, expect, it } from "vitest";

import { summary } from "@/lib/text/summary";

describe("summary", () => {
  it("keeps a short text whole, on one line", () => {
    expect(summary("An illustrator.\n\nShe paints.")).toBe("An illustrator. She paints.");
  });

  it("cuts a long text after its last whole word, with an ellipsis", () => {
    expect(summary("An illustrator known for digital works", 20)).toBe("An illustrator…");
  });

  it("does not end on the punctuation before the cut", () => {
    expect(summary("Realism, fantasy and color", 12)).toBe("Realism…");
  });

  it("cuts a text without spaces between its words", () => {
    const text = "插画家以数字作品闻名融合现实与幻想元素作品集涵盖多种主题";
    const cut = summary(text, 10);

    expect(cut.length).toBeLessThanOrEqual(10);
    expect(cut.endsWith("…")).toBe(true);
    expect(text.startsWith(cut.slice(0, -1))).toBe(true);
  });
});
