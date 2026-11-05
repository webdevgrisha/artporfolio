import { currencies } from "#modules/currencies/schema";
import { suggestedPrice } from "#modules/currencies/suggested-price";
import type { StoredWork, WorkPrice } from "#modules/gallery/works/schema";

type StoredPrice = NonNullable<StoredWork["price"]>;

/** The amount after the discount, rounded to a whole unit of the currency. */
export function discountedAmount(amount: number, discountPercent: number | null): number {
  return discountPercent === null ? amount : Math.round((amount * (100 - discountPercent)) / 100);
}

/**
 * The price of a work in every currency with a rate. The same percent is taken off each, and what
 * is left is not rounded to a step, so the discount a visitor reads adds up; it is never 0, which
 * would make the work free in a currency worth more than the dollar.
 */
export function pricesIn(
  { amount, discountPercent }: StoredPrice,
  rates: Record<string, number>,
): WorkPrice["prices"] {
  const prices: WorkPrice["prices"] = {};

  for (const currency of currencies) {
    const rate = rates[currency];

    if (rate !== undefined) {
      const suggested = suggestedPrice(amount, rate);

      prices[currency] = {
        amount: suggested,
        finalAmount: Math.max(1, discountedAmount(suggested, discountPercent)),
      };
    }
  }

  return prices;
}

/**
 * The price as the API returns it, with the amount after the discount rounded to a whole unit, and
 * the price in every other currency in use.
 */
export function toPrice(
  price: StoredWork["price"],
  rates: Record<string, number>,
): WorkPrice | null {
  if (price === null) {
    return null;
  }

  const { amount, currency, discountPercent } = price;

  return {
    amount,
    currency,
    discountPercent,
    finalAmount: discountedAmount(amount, discountPercent),
    prices: pricesIn(price, rates),
  };
}
