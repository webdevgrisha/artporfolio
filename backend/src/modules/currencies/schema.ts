import { z } from "zod";

/** The currencies a price may be shown in besides US dollars, the currency prices are set in. */
export const currencies = [
  "EUR",
  "GBP",
  "PLN",
  "CHF",
  "CAD",
  "AUD",
  "JPY",
  "CNY",
  "RUB",
  "BYN",
  "UAH",
] as const;

/** The highest rate: well above any currency, low enough to catch a typo. */
export const maxCurrencyRate = 1_000_000;

/**
 * The rate of every currency in use, as the client sends it to replace them all: how many units of
 * it one US dollar buys, with at most four decimals. A currency left out is not in use.
 */
export const currencyRatesBodySchema = z.strictObject({
  rates: z.partialRecord(
    z.enum(currencies),
    z.number().positive().max(maxCurrencyRate).multipleOf(0.0001),
  ),
});

/**
 * The rates as stored in Firestore and as the API returns them. Only their shape is checked: the
 * rules above apply when the rates are saved, so tightening a rule later never makes the saved
 * rates unreadable. There are none until they are first saved.
 */
export const currencyRatesSchema = z.object({
  rates: z.record(z.string(), z.number()),
});

export type CurrencyRates = z.infer<typeof currencyRatesSchema>;
