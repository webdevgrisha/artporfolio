import { queryOptions } from "@tanstack/react-query";

import { getCurrencyRates } from "./getCurrencyRates";

/** Every rate with their ETag. A save puts the saved rates here. */
export const currencyRatesQuery = queryOptions({
  queryFn: () => getCurrencyRates(),
  queryKey: ["currencies"],
});
