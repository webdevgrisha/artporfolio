import { z } from "zod";

/** The currencies a price may be shown in besides US dollars (backend/src/modules/currencies/schema.ts). */
export const currencies = ["EUR", "GBP", "PLN", "CHF", "CNY", "RUB", "BYN"] as const;

export type Currency = (typeof currencies)[number];

/** The highest rate (backend/src/modules/currencies/schema.ts). */
export const maxCurrencyRate = 1_000_000;

/**
 * How many units of each currency one US dollar buys. A currency without a rate is not in use, and
 * there are no rates until they are first saved.
 */
export const currencyRatesSchema = z.object({
  rates: z.record(z.string(), z.number()),
});

export type CurrencyRates = z.infer<typeof currencyRatesSchema>;
