import { useFormContext, useFormState, useWatch } from "react-hook-form";

import {
  type Currency,
  type CurrencyRates,
  currencies,
  currencyLabels,
  suggestedPrice,
} from "@/entities/currency";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { Fieldset } from "@/shared/ui/fieldset";

import type { WorkFormValues } from "../model/workFormSchema";
import { currencyPriceHint, parseWholeNumber, priceError } from "../model/workPrice";
import styles from "./WorkCurrencyPrices.module.css";

interface WorkCurrencyPricesProps {
  isSaving: boolean;
  rates: CurrencyRates["rates"];
}

/**
 * The price of the work in the other currencies: empty, a field offers the price by the rate and
 * follows the rate; filled, it keeps the price set by hand. Reads the form from its context.
 */
export function WorkCurrencyPrices({ isSaving, rates }: WorkCurrencyPricesProps) {
  const { control, register, setFocus, setValue } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  const price = useWatch({ control, name: "price" });
  const discountPercent = useWatch({ control, name: "discountPercent" });
  const currencyPrices = useWatch({ control, name: "currencyPrices" });
  // A currency whose rate was removed stays while it has a price set by hand.
  const shown = currencies.filter(
    (currency) => rates[currency] !== undefined || currencyPrices[currency] !== "",
  );

  if (price.trim() === "" || priceError(price) !== null || shown.length === 0) {
    return null;
  }

  const amount = parseWholeNumber(price);

  function suggestionFor(currency: Currency): number | null {
    const rate = rates[currency];

    return rate === undefined ? null : suggestedPrice(amount, rate);
  }

  function clearField(currency: Currency) {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue(`currencyPrices.${currency}`, "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus(`currencyPrices.${currency}`);
  }

  return (
    <Fieldset
      legend="В других валютах"
      hint="Пустое поле — цена по курсу, с округлением вверх"
      disabled={isSaving}
    >
      <div className={styles.fields}>
        {shown.map((currency) => {
          const suggested = suggestionFor(currency);
          const text = currencyPrices[currency];

          return (
            <ClearableInput
              key={currency}
              label={currencyLabels[currency]}
              hint={currencyPriceHint({ discountPercent, suggested, text })}
              inputMode="numeric"
              autoComplete="off"
              placeholder={suggested?.toLocaleString("ru")}
              error={errors.currencyPrices?.[currency]?.message}
              isModified={Boolean(dirtyFields.currencyPrices?.[currency])}
              hasValue={text !== ""}
              clearLabel={`Вернуть цену по курсу: ${currency}`}
              onClear={() => clearField(currency)}
              {...register(`currencyPrices.${currency}`)}
            />
          );
        })}
      </div>
    </Fieldset>
  );
}
