import {
  maxWorkDiscount,
  maxWorkPrice,
  minWorkDiscount,
  type WorkCurrency,
  type WorkPrice,
} from "@/entities/gallery";

import { discountedAmount } from "./workPriceAmount";

/** The currency the form sets a price in; the only one for now. */
export const workFormCurrency: WorkCurrency = "USD";

/**
 * The number a price or a discount field holds, as typed: digits, which may be split by spaces into
 * thousands, such as «1 500». NaN for anything else.
 */
function parseWholeNumber(text: string): number {
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
