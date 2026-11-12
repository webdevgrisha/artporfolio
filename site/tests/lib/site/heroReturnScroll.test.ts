import { describe, expect, it } from "vitest";

import { heroReturnScroll } from "@/lib/site/heroReturnScroll";

describe("heroReturnScroll", () => {
  it("brings the hero back three quarters of its way, where the line stands written", () => {
    expect(heroReturnScroll(0, 900)).toBe(675);
  });

  it("counts the way from where the hero starts, wherever it is on the page", () => {
    expect(heroReturnScroll(100, 944)).toBe(733);
  });
});
