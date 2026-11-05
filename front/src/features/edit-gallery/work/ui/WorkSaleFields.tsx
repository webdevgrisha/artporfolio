import React from "react";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import { Input } from "@/shared/ui/input";
import { RadioGroup } from "@/shared/ui/radio-group";

import type { WorkReferences } from "../model/useWorkReferences";
import type { WorkFormValues } from "../model/workFormSchema";
import { workSaleStatusOptions } from "../model/workSaleStatus";
import { FinalPrice } from "./FinalPrice";
import { WorkCurrencyPrices } from "./WorkCurrencyPrices";
import styles from "./WorkFields.module.css";

interface WorkSaleFieldsProps {
  isSaving: boolean;
  rates: WorkReferences["rates"];
}

/** Whether a visitor can buy the work, and for how much. */
export function WorkSaleFields({ isSaving, rates }: WorkSaleFieldsProps) {
  const { control, register } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  // Radio buttons, as for the format.
  const { field: saleStatusField } = useController({ control, name: "saleStatus" });
  // A discount needs a price, so typing the price checks the discount again.
  const priceField = register("price", { deps: ["discountPercent"] });
  const discountField = register("discountPercent");
  const price = useWatch({ control, name: "price" });
  const discountPercent = useWatch({ control, name: "discountPercent" });
  const priceId = React.useId();
  const discountId = React.useId();

  return (
    <>
      <RadioGroup
        label="Статус"
        name={saleStatusField.name}
        options={workSaleStatusOptions}
        value={saleStatusField.value}
        disabled={isSaving}
        isModified={Boolean(dirtyFields.saleStatus)}
        onChange={saleStatusField.onChange}
      />
      <div className={styles.priceBox}>
        <div className={styles.price}>
          <Input
            id={priceId}
            className={styles.amount}
            label="Цена, $"
            hint="Необязательно"
            inputMode="numeric"
            autoComplete="off"
            placeholder="1 500"
            disabled={isSaving}
            error={errors.price?.message}
            isModified={Boolean(dirtyFields.price)}
            {...priceField}
          />
          <Input
            id={discountId}
            className={styles.discount}
            label="Скидка, %"
            hint="Необязательно"
            inputMode="numeric"
            autoComplete="off"
            placeholder="10"
            disabled={isSaving}
            error={errors.discountPercent?.message}
            isModified={Boolean(dirtyFields.discountPercent)}
            {...discountField}
          />
        </div>
        <FinalPrice
          price={price}
          discountPercent={discountPercent}
          sourceIds={`${priceId} ${discountId}`}
        />
        <WorkCurrencyPrices price={price} discountPercent={discountPercent} rates={rates} />
      </div>
    </>
  );
}
