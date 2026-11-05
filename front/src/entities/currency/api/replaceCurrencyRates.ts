import { http, type Tagged } from "@/shared/api/http";

import { type CurrencyRates, currencyRatesSchema } from "../model/currencyRates";

interface ReplaceCurrencyRatesParams {
  /** The ETag of the rates the new ones were made from. */
  etag: string;
  /** A saved rate left out is deleted. */
  rates: CurrencyRates;
}

/**
 * Replaces every rate and returns them as saved with their new ETag. Rejected with 412 when they
 * have changed since `etag` was read, for example in another tab.
 */
export function replaceCurrencyRates({
  etag,
  rates,
}: ReplaceCurrencyRatesParams): Promise<Tagged<CurrencyRates>> {
  return http.putIfMatch({
    path: "/currencies",
    body: rates,
    etag,
    schema: currencyRatesSchema,
  });
}
