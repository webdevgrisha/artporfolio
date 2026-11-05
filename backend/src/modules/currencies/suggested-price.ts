/** The steps a price rounds up to, repeated at every power of ten: 120, 1 200, 12 000… */
const priceSteps = [
  100, 110, 120, 130, 140, 150, 160, 180, 200, 220, 250, 280, 300, 350, 400, 450, 500, 550, 600,
  650, 700, 750, 800, 850, 900, 950, 1_000,
];

/** The nearest step at or above the value; below 10 the steps would not be whole, so a whole unit. */
function roundUpToStep(value: number): number {
  if (value < 10) {
    return Math.max(1, Math.ceil(value));
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = priceSteps.find((candidate) => (candidate * magnitude) / 100 >= value) ?? 1_000;

  return (step * magnitude) / 100;
}

/**
 * The price in a currency for an amount in US dollars: the amount by the rate, rounded up to a
 * figure that reads well on a price tag, such as 430 to 450.
 */
export function suggestedPrice(amount: number, rate: number): number {
  // To cents first: 500 × 0.9 is a little above 450 in floating point, and would round up to 500.
  return roundUpToStep(Math.round(amount * rate * 100) / 100);
}
