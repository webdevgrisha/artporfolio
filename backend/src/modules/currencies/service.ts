import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type CurrencyRates, currencyRatesSchema } from "#modules/currencies/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";

const noRates: CurrencyRates = { rates: {} };

/** The document that holds the rate of every currency, and nothing else. */
export function ratesDocument() {
  return firestore().doc("site/currencies");
}

function readRates(snapshot: DocumentSnapshot): CurrencyRates {
  return snapshot.exists ? currencyRatesSchema.parse(snapshot.data()) : noRates;
}

/** How many units of each currency in use one US dollar buys. */
export function ratesIn(snapshot: DocumentSnapshot): CurrencyRates["rates"] {
  return readRates(snapshot).rates;
}

/** The rates with the entity tag for If-Match; there are none until they are first saved. */
export async function getCurrencyRates(): Promise<Tagged<CurrencyRates>> {
  const rates = readRates(await ratesDocument().get());

  return { data: rates, etag: entityTag(rates) };
}

/** Replaces every rate while they are still the ones the client read (`ifMatch`). */
export async function replaceCurrencyRates(
  rates: CurrencyRates,
  ifMatch: string,
): Promise<Tagged<CurrencyRates>> {
  await firestore().runTransaction(async (transaction) => {
    const document = ratesDocument();

    assertIfMatch(ifMatch, readRates(await transaction.get(document)));
    transaction.set(document, rates);
  });

  return { data: rates, etag: entityTag(rates) };
}
