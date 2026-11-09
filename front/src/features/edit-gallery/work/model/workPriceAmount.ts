import { suggestedPrice } from "@/entities/currency";

/** The amount after the discount, rounded to a whole unit, as the server computes it. */
export function discountedAmount(amount: number, discountPercent: number | null): number {
  return discountPercent === null ? amount : Math.round((amount * (100 - discountPercent)) / 100);
}

/**
 * The price after the discount in a currency, as the server computes it: never 0, which would make
 * the work free in a currency worth more than the dollar.
 */
export function discountedPriceIn(
  amount: number,
  rate: number,
  discountPercent: number | null,
): number {
  return Math.max(1, discountedAmount(suggestedPrice(amount, rate), discountPercent));
}
