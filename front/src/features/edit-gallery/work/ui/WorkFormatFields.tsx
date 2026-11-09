import { useController, useFormContext, useFormState } from "react-hook-form";

import { maxWorkSetSize, minWorkSetSize } from "@/entities/gallery";
import { Input } from "@/shared/ui/input";
import { RadioGroup } from "@/shared/ui/radio-group";

import { workFormatOptions } from "../model/workFormat";
import type { WorkFormValues } from "../model/workFormSchema";
import { WorkDateFields } from "./WorkDateFields";
import styles from "./WorkFields.module.css";
import { WorkPlaceFields } from "./WorkPlaceFields";
import { WorkSizeFields } from "./WorkSizeFields";

interface WorkFormatFieldsProps {
  isSaving: boolean;
}

/** What the work is made up of, its size, and when and where it was made; they register in order. */
export function WorkFormatFields({ isSaving }: WorkFormatFieldsProps) {
  const { control, register } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  // Radio buttons always hold a choice, so the format is never invalid and needs no ref. Only a set
  // needs a count, so choosing the format checks the count again.
  const { field: formatField } = useController({
    control,
    name: "format",
    rules: { deps: ["partCount"] },
  });
  const partCountField = register("partCount");
  // The count of works opens under «Несколько работ», the only format that needs it.
  const formatOptions = workFormatOptions.map((option) =>
    option.value === "set"
      ? {
          ...option,
          details: (
            <Input
              className={styles.count}
              label="Количество работ"
              hint={`От ${String(minWorkSetSize)} до ${String(maxWorkSetSize)}`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="10"
              disabled={isSaving}
              error={errors.partCount?.message}
              isModified={Boolean(dirtyFields.partCount)}
              {...partCountField}
            />
          ),
        }
      : option,
  );

  return (
    <>
      <RadioGroup
        label="Формат"
        name={formatField.name}
        options={formatOptions}
        value={formatField.value}
        disabled={isSaving}
        isModified={Boolean(dirtyFields.format)}
        onChange={formatField.onChange}
      />
      <WorkSizeFields isSaving={isSaving} />
      <WorkDateFields isSaving={isSaving} />
      <WorkPlaceFields isSaving={isSaving} />
    </>
  );
}
