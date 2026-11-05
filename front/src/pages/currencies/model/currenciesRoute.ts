import { currencyRatesQuery } from "@/entities/currency";
import { fetchFresh, loadPageData } from "@/shared/api/pageData";

// The page loads the rates afresh on entering it, and shows its skeleton meanwhile.

export function currenciesLoader() {
  return loadPageData(fetchFresh(currencyRatesQuery));
}
