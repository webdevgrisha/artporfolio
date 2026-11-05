import { type CurrencyRates, currencies, currencyLabels } from "@/entities/currency";

import {
  discountError,
  discountedPriceIn,
  formatPrice,
  parseWholeNumber,
  priceError,
} from "../model/workPrice";
import styles from "./WorkCurrencyPrices.module.css";

interface WorkCurrencyPricesProps {
  /** The percent taken off, as typed. */
  discountPercent: string;
  /** The price in dollars, as typed. */
  price: string;
  rates: CurrencyRates["rates"];
}

/**
 * What the work costs after the discount in the currencies with a rate, as the site will show it.
 * Nothing while the price is empty or wrong.
 */
export function WorkCurrencyPrices({ discountPercent, price, rates }: WorkCurrencyPricesProps) {
  const shown = currencies.flatMap((currency) => {
    const rate = rates[currency];

    return rate === undefined ? [] : [{ currency, rate }];
  });

  if (
    price.trim() === "" ||
    priceError(price) !== null ||
    discountError(discountPercent, price) !== null ||
    shown.length === 0
  ) {
    return null;
  }

  const amount = parseWholeNumber(price);
  const discount = discountPercent.trim() === "" ? null : parseWholeNumber(discountPercent);

  return (
    <dl className={styles.root}>
      {shown.map(({ currency, rate }) => (
        <div key={currency} className={styles.item}>
          <dt>{currencyLabels[currency]}</dt>
          <dd className={styles.value}>
            {formatPrice(discountedPriceIn(amount, rate, discount), currency)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
