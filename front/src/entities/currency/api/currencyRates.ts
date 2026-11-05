import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";

import { type CurrencyRates, currencyRatesSchema } from "../model/currencyRates";

interface ReplaceCurrencyRatesParams {
  /** The ETag of the rates the new ones were made from. */
  etag: string;
  /** A saved rate left out is deleted. */
  rates: CurrencyRates;
}

/** Every rate with their ETag. A save puts the saved rates here. */
export const currencyRatesQuery = queryOptions({
  queryFn: (): Promise<Tagged<CurrencyRates>> =>
    http.getWithETag({ path: "/currencies", schema: currencyRatesSchema }),
  queryKey: ["currencies"],
});

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
