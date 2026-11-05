import { currencyRatesQuery, replaceCurrencyRates } from "@/entities/currency";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { useReplaceResource } from "@/shared/api/useReplaceResource";

import { getSaveCurrencyRatesErrorMessage } from "../lib/saveErrorMessages";

export const saveCurrencyRatesFeedback: MutationFeedback = {
  getErrorMessage: getSaveCurrencyRatesErrorMessage,
  toastId: "currency-rates-save",
};

/**
 * Replaces all rates, then puts the saved rates into the cache: the server returns them with their
 * ETag, so the page need not load them again.
 */
export function useSaveCurrencyRates() {
  return useReplaceResource({
    feedback: saveCurrencyRatesFeedback,
    mutationFn: replaceCurrencyRates,
    queryKey: currencyRatesQuery.queryKey,
  });
}
