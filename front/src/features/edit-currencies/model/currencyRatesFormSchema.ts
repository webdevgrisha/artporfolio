import { z } from "zod";

import {
  type Currency,
  type CurrencyRates,
  currencies,
  maxCurrencyRate,
} from "@/entities/currency";

/** The number a rate field holds, as typed, with a comma or a dot; NaN for anything else. */
function parseRate(text: string): number {
  const number = text.replace(/\s/g, "").replace(",", ".");

  return /^\d+(\.\d+)?$/.test(number) ? Number(number) : Number.NaN;
}

/** What is wrong with the rate as typed, or null when it is empty or a valid rate. */
export function rateError(text: string): string | null {
  if (text.trim() === "") {
    return null;
  }

  const rate = parseRate(text);

  if (Number.isNaN(rate)) {
    return "Введите число, например 0,92";
  }

  if (rate <= 0) {
    return "Курс больше нуля";
  }

  if (rate > maxCurrencyRate) {
    return `Не больше ${maxCurrencyRate.toLocaleString("ru")}`;
  }

  // Mirrors the server rule in backend/src/modules/currencies/schema.ts.
  return /[,.]\d{5,}$/.test(text.trim()) ? "Не больше 4 знаков после запятой" : null;
}

const rateFieldSchema = z.string().superRefine((text, context) => {
  const message = rateError(text);

  if (message !== null) {
    context.addIssue({ code: "custom", message });
  }
});

export const currencyRatesFormSchema = z.object({
  /** The rates as typed; empty for a currency that is not in use. */
  rates: z.record(z.enum(currencies), rateFieldSchema),
});

export type CurrencyRatesFormValues = z.infer<typeof currencyRatesFormSchema>;

/** The values of the rates as stored on the server, in the Russian notation: «0,92». */
export function toCurrencyRatesFormValues({ rates }: CurrencyRates): CurrencyRatesFormValues {
  const values = currencies.map((currency): [Currency, string] => [
    currency,
    String(rates[currency] ?? "").replace(".", ","),
  ]);

  return { rates: Object.fromEntries(values) as Record<Currency, string> };
}

/** The rates the form holds, once they have been checked; an empty field is left out. */
export function toCurrencyRates({ rates }: CurrencyRatesFormValues): CurrencyRates {
  const filled = currencies.filter((currency) => rates[currency].trim() !== "");

  return {
    rates: Object.fromEntries(filled.map((currency) => [currency, parseRate(rates[currency])])),
  };
}
