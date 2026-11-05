import { currencyRatesQuery } from "@/entities/currency";
import { loadFresh } from "@/shared/api/pageData";

import { CurrenciesPage } from "./ui/CurrenciesPage";

export const currenciesRoute = {
  Component: CurrenciesPage,
  loader: () => loadFresh(currencyRatesQuery),
};
