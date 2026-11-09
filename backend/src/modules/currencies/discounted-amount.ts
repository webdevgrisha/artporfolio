/** The amount after the discount, rounded to a whole unit of the currency. */
export function discountedAmount(amount: number, discountPercent: number | null): number {
  return discountPercent === null ? amount : Math.round((amount * (100 - discountPercent)) / 100);
}
