import { useController, useFormContext, useFormState } from "react-hook-form";

import { monthOptions } from "@/entities/gallery";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";

import type { WorkFormValues } from "../model/workFormSchema";
import styles from "./WorkFields.module.css";

interface WorkDateFieldsProps {
  isSaving: boolean;
}

/** When the work was finished, as it is read: the month, then the year. */
export function WorkDateFields({ isSaving }: WorkDateFieldsProps) {
  const { control, register } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  // A select has no input for react-hook-form to register, so a controller keeps its value.
  const { field: monthField } = useController({ control, name: "month" });
  // A month of this year may be still to come, so typing the year checks the month again.
  const yearField = register("year", { deps: ["month"] });

  return (
    <div className={styles.date}>
      <Select
        className={styles.month}
        label="Месяц"
        placeholder="Выберите"
        options={monthOptions}
        disabled={isSaving}
        error={errors.month?.message}
        isModified={Boolean(dirtyFields.month)}
        ref={monthField.ref}
        value={monthField.value}
        onBlur={monthField.onBlur}
        onChange={monthField.onChange}
      />
      <Input
        className={styles.year}
        label="Год"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        placeholder={String(new Date().getFullYear())}
        disabled={isSaving}
        error={errors.year?.message}
        isModified={Boolean(dirtyFields.year)}
        {...yearField}
      />
    </div>
  );
}
