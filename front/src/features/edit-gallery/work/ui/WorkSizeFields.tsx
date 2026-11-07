import { useFormContext, useFormState } from "react-hook-form";

import { Input } from "@/shared/ui/input";

import type { WorkFormValues } from "../model/workFormSchema";
import styles from "./WorkFields.module.css";

interface WorkSizeFieldsProps {
  isSaving: boolean;
}

/** The width and the height of a work. */
export function WorkSizeFields({ isSaving }: WorkSizeFieldsProps) {
  const { control, register } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const widthField = register("width");
  const heightField = register("height");

  return (
    <div className={styles.size}>
      <Input
        className={styles.side}
        label="Ширина, см"
        inputMode="decimal"
        autoComplete="off"
        placeholder="50"
        disabled={isSaving}
        error={errors.width?.message}
        isModified={Boolean(dirtyFields.width)}
        {...widthField}
      />
      <Input
        className={styles.side}
        label="Высота, см"
        inputMode="decimal"
        autoComplete="off"
        placeholder="70"
        disabled={isSaving}
        error={errors.height?.message}
        isModified={Boolean(dirtyFields.height)}
        {...heightField}
      />
    </div>
  );
}
