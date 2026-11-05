import { describe, expect, it } from "vitest";

import {
  rateError,
  toCurrencyRates,
  toCurrencyRatesFormValues,
} from "@/features/edit-currencies/model/currencyRatesFormSchema";

describe("rateError", () => {
  it("takes an empty field: the currency is not in use", () => {
    expect(rateError("")).toBeNull();
    expect(rateError("  ")).toBeNull();
  });

  it("takes a comma, a dot and up to four decimals", () => {
    expect(rateError("0,92")).toBeNull();
    expect(rateError("0.9234")).toBeNull();
    expect(rateError("1 000")).toBeNull();
  });

  it("refuses what is not a number", () => {
    expect(rateError("abc")).toBe("Введите число, например 0,92");
    expect(rateError("1,2,3")).toBe("Введите число, например 0,92");
    expect(rateError("-1")).toBe("Введите число, например 0,92");
  });

  it("refuses zero, too large a rate and too many decimals", () => {
    expect(rateError("0")).toBe("Курс больше нуля");
    expect(rateError("1000001")).toBe("Не больше 1\u00a0000\u00a0000");
    expect(rateError("0,92345")).toBe("Не больше 4 знаков после запятой");
  });
});

describe("the values of the form", () => {
  it("show a saved rate with a comma, and a currency without a rate as empty", () => {
    const { rates } = toCurrencyRatesFormValues({ rates: { EUR: 0.92, RUB: 80 } });

    expect(rates).toMatchObject({ EUR: "0,92", GBP: "", RUB: "80" });
  });

  it("become the rates, leaving out the empty fields", () => {
    const values = toCurrencyRatesFormValues({ rates: {} });

    values.rates.EUR = " 0,92 ";
    values.rates.PLN = "3.65";

    expect(toCurrencyRates(values)).toEqual({ rates: { EUR: 0.92, PLN: 3.65 } });
  });
});
