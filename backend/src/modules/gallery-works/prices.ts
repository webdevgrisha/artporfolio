import { currencies } from "#modules/currencies/schema";
import { suggestedPrice } from "#modules/currencies/suggested-price";
import { discountedAmount, type StoredWork, type Work } from "#modules/gallery-works/schema";

type StoredPrice = NonNullable<StoredWork["price"]>;

type CurrencyPrices = NonNullable<Work["price"]>["prices"];

/**
 * The price of a work in every other currency: the one set by hand, or else the one by the rate. A
 * currency with neither is left out. The same percent is taken off each, and what is left is not
 * rounded to a step, so the discount a visitor reads adds up.
 */
export function pricesIn(
  { amount, discountPercent, overrides }: StoredPrice,
  rates: Record<string, number>,
): CurrencyPrices {
  const prices: CurrencyPrices = {};

  for (const currency of currencies) {
    const override = overrides[currency];
    const rate = rates[currency];

    if (override !== undefined) {
      prices[currency] = {
        amount: override,
        finalAmount: discountedAmount(override, discountPercent),
        source: "manual",
      };
    } else if (rate !== undefined) {
      const suggested = suggestedPrice(amount, rate);

      prices[currency] = {
        amount: suggested,
        finalAmount: discountedAmount(suggested, discountPercent),
        source: "rate",
      };
    }
  }

  return prices;
}
