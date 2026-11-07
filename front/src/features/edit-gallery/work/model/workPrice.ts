import { type Currency, suggestedPrice } from "@/entities/currency";
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
 * The price and the discount as typed, as numbers: to show what they come to while typing. Null
 * while the price is empty, or either has an error.
 */
export function parseTypedPrice(
  price: string,
  discountPercent: string,
): { amount: number; discount: number | null } | null {
  if (price.trim() === "" || priceError(price) !== null) return null;
  if (discountError(discountPercent, price) !== null) return null;

  return {
    amount: parseWholeNumber(price),
    discount: discountPercent.trim() === "" ? null : parseWholeNumber(discountPercent),
  };
}

/** The amount after the discount, rounded to a whole unit, as the server computes it. */
export function discountedAmount(amount: number, discountPercent: number | null): number {
  return discountPercent === null ? amount : Math.round((amount * (100 - discountPercent)) / 100);
}

/** The price the form holds, once it has been checked; null when the field is empty. */
export function toWorkPrice({
  discountPercent,
  price,
}: {
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
  };
}

/**
 * The price after the discount in a currency, as the server computes it: never 0, which would make
 * the work free in a currency worth more than the dollar.
 */
export function discountedPriceIn(
  amount: number,
  rate: number,
  discountPercent: number | null,
): number {
  return Math.max(1, discountedAmount(suggestedPrice(amount, rate), discountPercent));
}

/** One format per currency: making it is slow, and a table and a form ask for it often. */
const priceFormats = new Map<Currency | WorkCurrency, Intl.NumberFormat>();

function priceFormat(currency: Currency | WorkCurrency): Intl.NumberFormat {
  const format =
    priceFormats.get(currency) ??
    new Intl.NumberFormat("ru", { currency, maximumFractionDigits: 0, style: "currency" });

  priceFormats.set(currency, format);

  return format;
}

/** A price as the admin reads it, in whole units: «1 500 $». */
export function formatPrice(amount: number, currency: Currency | WorkCurrency): string {
  return priceFormat(currency).format(amount);
}
