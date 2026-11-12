import { currencyRatesSchema } from "@/lib/api/currencies";
import { getJson } from "@/lib/api/getJson";
import type { Language } from "@/lib/i18n/languages";
import { baseCurrency } from "@/lib/site/currency";

/**
 * The currencies a visitor may see the prices in, by their codes: the one the prices are set in,
 * then every one the artist gave a rate, in the order of the admin. When the API cannot answer,
 * the page is still shown, with its own currency only.
 */
export async function availableCurrencies(language: Language): Promise<string[]> {
  try {
    const { rates } = await getJson("currencies", currencyRatesSchema, { language });

    return [baseCurrency, ...Object.keys(rates).filter((code) => code !== baseCurrency)];
  } catch (error) {
    console.error("The page is shown without the other currencies:", error);

    return [baseCurrency];
  }
}
