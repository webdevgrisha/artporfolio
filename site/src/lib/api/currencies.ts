import { z } from "zod";

/**
 * The rates of the currencies in use as `GET /api/currencies` returns them: how many units of each
 * one US dollar buys, by its ISO 4217 code. A currency without a rate is not in use.
 */
export const currencyRatesSchema = z.object({
  rates: z.record(z.string(), z.number()),
});
