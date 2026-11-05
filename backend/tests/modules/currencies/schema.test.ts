import { describe, expect, it } from "vitest";

import { currencyRatesBodySchema, maxCurrencyRate } from "#modules/currencies/schema";

function isValid(rates: unknown): boolean {
  return currencyRatesBodySchema.safeParse({ rates }).success;
}

describe("currency rates body", () => {
  it("takes the rates of some of the currencies", () => {
    expect(currencyRatesBodySchema.parse({ rates: { EUR: 0.9234, PLN: 3.65 } })).toEqual({
      rates: { EUR: 0.9234, PLN: 3.65 },
    });
  });

  it("takes no rates at all", () => {
    expect(isValid({})).toBe(true);
  });

  it("refuses a currency outside the list", () => {
    expect(isValid({ USD: 1 })).toBe(false);
    expect(isValid({ XXX: 1 })).toBe(false);
  });

  it("needs a rate above zero and up to the limit", () => {
    expect(isValid({ EUR: 0 })).toBe(false);
    expect(isValid({ EUR: -1 })).toBe(false);
    expect(isValid({ RUB: maxCurrencyRate })).toBe(true);
    expect(isValid({ RUB: maxCurrencyRate + 1 })).toBe(false);
  });

  it("keeps at most four decimals", () => {
    expect(isValid({ EUR: 0.0001 })).toBe(true);
    expect(isValid({ EUR: 0.00001 })).toBe(false);
  });

  it("refuses a rate that is not a number and a field it does not know", () => {
    expect(isValid({ EUR: "0.92" })).toBe(false);
    expect(isValid({ EUR: null })).toBe(false);
    expect(currencyRatesBodySchema.safeParse({ base: "USD", rates: {} }).success).toBe(false);
  });
});
