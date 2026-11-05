import { useSuspenseQuery } from "@tanstack/react-query";

import { currencyRatesQuery } from "@/entities/currency";
import { EditCurrencyRatesForm, EditCurrencyRatesFormSkeleton } from "@/features/edit-currencies";
import { AwaitPageData } from "@/shared/ui/page-data";

import styles from "./CurrenciesPage.module.css";

export function CurrenciesPage() {
  return (
    <div className={styles.root}>
      <AwaitPageData fallback={<EditCurrencyRatesFormSkeleton className={styles.form} />}>
        <CurrencyRatesForm />
      </AwaitPageData>
    </div>
  );
}

function CurrencyRatesForm() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: rates } = useSuspenseQuery(currencyRatesQuery);

  return <EditCurrencyRatesForm className={styles.form} rates={rates} />;
}
