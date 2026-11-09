import type { Currency } from "@/entities/currency";
import type { WorkCurrency } from "@/entities/gallery";

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
