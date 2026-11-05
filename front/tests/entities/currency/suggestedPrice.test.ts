import { describe, expect, it } from "vitest";

import { suggestedPrice } from "@/entities/currency";

describe("suggestedPrice", () => {
  it("rounds up to the next step", () => {
    expect(suggestedPrice(430, 1)).toBe(450);
    expect(suggestedPrice(375, 1)).toBe(400);
    expect(suggestedPrice(1825, 1)).toBe(2000);
    expect(suggestedPrice(18, 1)).toBe(20);
  });

  it("keeps a price already on a step", () => {
    expect(suggestedPrice(450, 1)).toBe(450);
    expect(suggestedPrice(1200, 1)).toBe(1200);
    expect(suggestedPrice(1000, 1)).toBe(1000);
  });

  it("goes on to the next power of ten", () => {
    expect(suggestedPrice(901, 1)).toBe(1000);
    expect(suggestedPrice(9100, 1)).toBe(10_000);
    expect(suggestedPrice(115_000, 1)).toBe(120_000);
  });

  it("applies the rate first", () => {
    expect(suggestedPrice(1500, 0.8899)).toBe(1500);
    expect(suggestedPrice(1500, 3.9097)).toBe(6000);
    expect(suggestedPrice(1500, 158.3779)).toBe(250_000);
  });

  it("is not thrown a step up by floating point", () => {
    // 500 × 0.9 is 450.00000000000006 without the rounding to cents.
    expect(suggestedPrice(500, 0.9)).toBe(450);
  });

  it("gives a whole unit, at least 1, for the smallest prices", () => {
    expect(suggestedPrice(1, 0.8899)).toBe(1);
    expect(suggestedPrice(5, 0.7423)).toBe(4);
    expect(suggestedPrice(1, 0.0001)).toBe(1);
  });
});
