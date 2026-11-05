import { http, type Tagged } from "@/shared/api/http";

import { type CurrencyRates, currencyRatesSchema } from "../model/currencyRates";

/** Every rate with the ETag that a replacement of them sends back. */
export function getCurrencyRates(): Promise<Tagged<CurrencyRates>> {
  return http.getWithETag({ path: "/currencies", schema: currencyRatesSchema });
}
