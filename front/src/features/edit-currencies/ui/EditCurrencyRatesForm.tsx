import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";

import { type CurrencyRates, currencies, currencyRatesQuery } from "@/entities/currency";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { Fieldset } from "@/shared/ui/fieldset";
import { Input } from "@/shared/ui/input";

import { currencyLabels } from "../model/currencyFields";
import {
  type CurrencyRatesFormValues,
  currencyRatesFormSchema,
  toCurrencyRates,
  toCurrencyRatesFormValues,
} from "../model/currencyRatesFormSchema";
import { saveCurrencyRatesFeedback, useSaveCurrencyRates } from "../model/useSaveCurrencyRates";
import styles from "./EditCurrencyRatesForm.module.css";

interface EditCurrencyRatesFormProps {
  className?: string;
  /** The rates as stored on the server when the form opens, with their ETag. */
  rates: Tagged<CurrencyRates>;
}

export function EditCurrencyRatesForm({ className, rates }: EditCurrencyRatesFormProps) {
  const form = useForm<CurrencyRatesFormValues>({
    defaultValues: toCurrencyRatesFormValues(rates.data),
    resolver: zodResolver(currencyRatesFormSchema),
  });
  const { dirtyFields, errors } = useFormState({ control: form.control });
  const saveRates = useSaveCurrencyRates();
  const { editForm } = useSavedForm({
    form,
    initial: rates,
    query: currencyRatesQuery,
    // The server replaces all rates at once.
    save: (values, etag) => saveRates.mutateAsync({ etag, rates: toCurrencyRates(values) }),
    toValues: toCurrencyRatesFormValues,
    toastId: saveCurrencyRatesFeedback.toastId,
  });

  return (
    <EditForm className={className} {...editForm}>
      <Fieldset
        legend="Сколько стоит 1 $"
        hint="Необязательно. Валюта без курса не используется"
        disabled={editForm.isSaving}
      >
        <div className={styles.fields}>
          {currencies.map((currency) => (
            <Input
              key={currency}
              label={currencyLabels[currency]}
              inputMode="decimal"
              autoComplete="off"
              error={errors.rates?.[currency]?.message}
              isModified={Boolean(dirtyFields.rates?.[currency])}
              {...form.register(`rates.${currency}`)}
            />
          ))}
        </div>
      </Fieldset>
    </EditForm>
  );
}
