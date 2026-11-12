import { describe, expect, it } from "vitest";

import { currencyName } from "@/lib/i18n/currencyName";

describe("currencyName", () => {
  it("names a currency in the language of the page, with a capital", () => {
    expect(currencyName("EUR", "en")).toBe("Euro");
    expect(currencyName("EUR", "ru")).toBe("Евро");
    expect(currencyName("PLN", "pl")).toBe("Złoty polski");
  });
});
