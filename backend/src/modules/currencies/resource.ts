import { type CurrencyRates, currencyRatesSchema } from "#modules/currencies/schema";
import { documentResource } from "#shared/firebase/document-resource";
import { firestore } from "#shared/firebase/firestore";

/** How many units of each currency in use one US dollar buys. */
export const currencyRates = documentResource<CurrencyRates>({
  document: () => firestore().doc("site/currencies"),
  empty: { rates: {} },
  schema: currencyRatesSchema,
});
