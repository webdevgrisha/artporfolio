import { currencies } from "@/entities/currency";
import { FieldSkeleton, FormSkeleton } from "@/shared/ui/skeleton";

import styles from "./EditCurrencyRatesForm.module.css";

interface EditCurrencyRatesFormSkeletonProps {
  className?: string;
}

/** EditCurrencyRatesForm while its rates load: a field per currency, as the form lays them out. */
export function EditCurrencyRatesFormSkeleton({ className }: EditCurrencyRatesFormSkeletonProps) {
  return (
    <FormSkeleton className={className}>
      <div className={styles.fields}>
        {currencies.map((currency) => (
          <FieldSkeleton key={currency} />
        ))}
      </div>
    </FormSkeleton>
  );
}
