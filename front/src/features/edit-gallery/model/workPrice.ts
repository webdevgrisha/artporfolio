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
 * is taken off a price, so it needs one.
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

  return priceText.trim() === "" ? "Сначала укажите цену" : null;
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

/** A price as the admin reads it, in whole units: «1 500 $». */
export function formatPrice(amount: number, currency: WorkCurrency): string {
  return new Intl.NumberFormat("ru", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}
