import { describe, expect, it } from "vitest";

import { pricesIn } from "#modules/gallery-works/prices";

const price = { amount: 1500, currency: "USD", discountPercent: null, overrides: {} } as const;

describe("pricesIn", () => {
  it("gives the price by the rate, rounded up to a step", () => {
    expect(pricesIn(price, { PLN: 3.9097 })).toEqual({
      PLN: { amount: 6000, finalAmount: 6000, source: "rate" },
    });
  });

  it("prefers the price set by hand", () => {
    expect(pricesIn({ ...price, overrides: { PLN: 5800 } }, { PLN: 3.9097 })).toEqual({
      PLN: { amount: 5800, finalAmount: 5800, source: "manual" },
    });
  });

  it("keeps a price set by hand in a currency whose rate was removed", () => {
    expect(pricesIn({ ...price, overrides: { PLN: 5800 } }, {})).toEqual({
      PLN: { amount: 5800, finalAmount: 5800, source: "manual" },
    });
  });

  it("takes the same percent off every price, without rounding what is left to a step", () => {
    const discounted = { ...price, discountPercent: 20, overrides: { PLN: 5800 } };

    expect(pricesIn(discounted, { EUR: 0.8899, PLN: 3.9097 })).toEqual({
      EUR: { amount: 1500, finalAmount: 1200, source: "rate" },
      PLN: { amount: 5800, finalAmount: 4640, source: "manual" },
    });
  });

  it("leaves out a currency without a rate or a price, and one no longer listed", () => {
    expect(pricesIn({ ...price, overrides: { SEK: 100 } }, { XXX: 2 })).toEqual({});
  });
});
