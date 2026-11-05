import { type Currency, currencies } from "@/entities/currency";
import {
  maxWorkDiscount,
  maxWorkPrice,
  minWorkDiscount,
  type WorkCurrency,
  type WorkPrice,
} from "@/entities/gallery";

/** The currency the form sets a price in; the only one for now. */
export const workFormCurrency: WorkCurrency = "USD";

/**
 * The number a price or a discount field holds, as typed: digits, which may be split by spaces into
 * thousands, such as «1 500». NaN for anything else.
 */
export function parseWholeNumber(text: string): number {
  const digits = text.replace(/\s/g, "");

  return /^\d+$/.test(digits) ? Number(digits) : Number.NaN;
}

/** What is wrong with the price as typed, or null when it is empty or a valid price. */
export function priceError(text: string): string | null {
  if (text.trim() === "") {
    return null;
  }

  const amount = parseWholeNumber(text);

  if (Number.isNaN(amount)) {
    return "Введите целое число, например 1 500";
  }

  if (amount < 1) {
    return "Цена больше нуля";
  }

  return amount > maxWorkPrice ? `Не больше ${maxWorkPrice.toLocaleString("ru")}` : null;
}

/**
 * What is wrong with the discount as typed, or null when it is empty or a valid discount. A discount
 * is taken off a price, so it needs one, and it may not leave nothing to pay.
 */
export function discountError(text: string, priceText: string): string | null {
  if (text.trim() === "") {
    return null;
  }

  const percent = parseWholeNumber(text);

  if (Number.isNaN(percent)) {
    return "Введите целое число";
  }

  if (percent < minWorkDiscount || percent > maxWorkDiscount) {
    return `От ${String(minWorkDiscount)} до ${String(maxWorkDiscount)}`;
  }

  if (priceText.trim() === "") {
    return "Сначала укажите цену";
  }

  // A price that is not valid has its own error.
  const amount = parseWholeNumber(priceText);

  return amount >= 1 && discountedAmount(amount, percent) < 1
    ? "Итоговая цена получается 0 $, уменьшите скидку"
    : null;
}

/**
 * What is wrong with a price set by hand as typed, or null when it is empty or a valid price. The
 * discount takes the same percent off it, and may not leave nothing to pay either.
 */
export function currencyPriceError(text: string, discountText: string): string | null {
  const error = priceError(text);

  if (error !== null || text.trim() === "") {
    return error;
  }

  const percent = parseWholeNumber(discountText);

  // A discount that is not valid has its own error.
  return percent >= minWorkDiscount &&
    percent <= maxWorkDiscount &&
    discountedAmount(parseWholeNumber(text), percent) < 1
    ? "Итоговая цена получается 0, уменьшите скидку"
    : null;
}

/** The amount after the discount, rounded to a whole unit, as the server computes it. */
export function discountedAmount(amount: number, discountPercent: number | null): number {
  return discountPercent === null ? amount : Math.round((amount * (100 - discountPercent)) / 100);
}

/** The prices set by hand as the form holds them; an empty field follows the rate. */
export type CurrencyPriceValues = Record<Currency, string>;

/** The fields of the prices set by hand, from the saved ones. */
export function toCurrencyPriceValues(overrides: WorkPrice["overrides"]): CurrencyPriceValues {
  const values = currencies.map((currency): [Currency, string] => [
    currency,
    String(overrides[currency] ?? ""),
  ]);

  return Object.fromEntries(values) as CurrencyPriceValues;
}

/** The price the form holds, once it has been checked; null when the field is empty. */
export function toWorkPrice({
  currencyPrices,
  discountPercent,
  price,
}: {
  currencyPrices: CurrencyPriceValues;
  discountPercent: string;
  price: string;
}): Omit<WorkPrice, "finalAmount"> | null {
  if (price.trim() === "") {
    return null;
  }

  return {
    amount: parseWholeNumber(price),
    currency: workFormCurrency,
    discountPercent: discountPercent.trim() === "" ? null : parseWholeNumber(discountPercent),
    overrides: Object.fromEntries(
      currencies
        .filter((currency) => currencyPrices[currency].trim() !== "")
        .map((currency) => [currency, parseWholeNumber(currencyPrices[currency])]),
    ),
  };
}

/** What a field of a price in another currency says about it, under the field. */
export function currencyPriceHint({
  discountPercent,
  suggested,
  text,
}: {
  /** The percent taken off, as typed; only a valid one is used. */
  discountPercent: string;
  /** The price by the rate; null for a currency without a rate. */
  suggested: number | null;
  /** The price set by hand, as typed. */
  text: string;
}): string {
  const isByRate = text.trim() === "";
  const byRate =
    suggested === null ? "Курс не задан" : `По курсу ${suggested.toLocaleString("ru")}`;
  const source = isByRate ? "По курсу" : `Вручную. ${byRate}`;
  const amount = isByRate ? suggested : parseWholeNumber(text);
  const percent = parseWholeNumber(discountPercent);

  if (
    amount === null ||
    Number.isNaN(amount) ||
    Number.isNaN(percent) ||
    percent < minWorkDiscount ||
    percent > maxWorkDiscount
  ) {
    return source;
  }

  return `${source}. Со скидкой ${discountedAmount(amount, percent).toLocaleString("ru")}`;
}

/** A price as the admin reads it, in whole units: «1 500 $». */
export function formatPrice(amount: number, currency: WorkCurrency): string {
  return new Intl.NumberFormat("ru", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}
