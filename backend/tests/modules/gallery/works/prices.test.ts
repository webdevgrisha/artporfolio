import { describe, expect, it } from "vitest";

import { pricesIn } from "#modules/gallery/works/prices";

const price = { amount: 1500, currency: "USD", discountPercent: null } as const;

describe("pricesIn", () => {
  it("gives the price by the rate, rounded up to a step", () => {
    expect(pricesIn(price, { PLN: 3.9097 })).toEqual({
      PLN: { amount: 6000, finalAmount: 6000 },
    });
  });

  it("takes the same percent off every price, without rounding what is left to a step", () => {
    expect(pricesIn({ ...price, discountPercent: 20 }, { EUR: 0.8899, PLN: 3.9097 })).toEqual({
      EUR: { amount: 1400, finalAmount: 1120 },
      PLN: { amount: 6000, finalAmount: 4800 },
    });
  });

  it("never leaves nothing to pay in a currency worth more than the dollar", () => {
    const cheap = { amount: 60, currency: "USD", discountPercent: 99 } as const;

    expect(pricesIn(cheap, { GBP: 0.7423 }).GBP?.finalAmount).toBe(1);
  });

  it("leaves out a currency without a rate, and one no longer listed", () => {
    expect(pricesIn(price, { XXX: 2 })).toEqual({});
  });
});
