import { currencyRates } from "#modules/currencies/resource";
import { currencyRatesBodySchema } from "#modules/currencies/schema";
import { documentResourceRouter } from "#shared/http/document-resource-router";

/** The rates are public, like the prices of the works the API computes from them. */
export const currenciesRouter = documentResourceRouter(currencyRates, currencyRatesBodySchema);
