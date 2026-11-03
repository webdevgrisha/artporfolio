import clsx from "clsx";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import { workSizeUnits } from "@/entities/gallery";
import type { Photo } from "@/shared/api/photo";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { Input } from "@/shared/ui/input";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { RadioGroup } from "@/shared/ui/radio-group";
import { Textarea } from "@/shared/ui/textarea";

import { type WorkFormValues, workMaxLengths, workSizeUnitLabels } from "../model/workFormSchema";
import styles from "./WorkFields.module.css";

interface WorkFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The photo of the saved work, shown while the photo field keeps it; none for a new work. */
  savedPhoto: Photo | null;
}

const unitOptions = workSizeUnits.map((unit) => ({ label: workSizeUnitLabels[unit], value: unit }));

/** The fields of a work form; they read the form from its context. */
export function WorkFields({ className, isSaving, savedPhoto }: WorkFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  const title = useWatch({ control, name: "title" });
  // A native radio group is not a text input: a controller keeps its value in the form's state
  // instead of the DOM, see the colours form.
  const { field: unitField } = useController({ control, name: "unit" });

  function clearTitle() {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue("title", "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus("title");
  }

  return (
    <div className={clsx(styles.root, className)}>
      <div className={styles.texts}>
        <ClearableInput
          label="Название"
          hint={`До ${String(workMaxLengths.title)} символов`}
          placeholder="Например: Слон на закате"
          disabled={isSaving}
          error={errors.title?.message}
          isModified={Boolean(dirtyFields.title)}
          hasValue={Boolean(title)}
          clearLabel="Очистить название"
          onClear={clearTitle}
          {...register("title")}
        />
        <Textarea
          label="Описание"
          hint={`Необязательно. До ${String(workMaxLengths.description)} символов. Абзацы разделяйте пустой строкой`}
          placeholder="О чём работа и как она сделана"
          rows={8}
          disabled={isSaving}
          error={errors.description?.message}
          isModified={Boolean(dirtyFields.description)}
          {...register("description")}
        />
        <div className={styles.size}>
          <Input
            className={styles.side}
            label="Ширина"
            inputMode="decimal"
            autoComplete="off"
            placeholder="50"
            disabled={isSaving}
            error={errors.width?.message}
            isModified={Boolean(dirtyFields.width)}
            {...register("width")}
          />
          <Input
            className={styles.side}
            label="Высота"
            inputMode="decimal"
            autoComplete="off"
            placeholder="70"
            disabled={isSaving}
            error={errors.height?.message}
            isModified={Boolean(dirtyFields.height)}
            {...register("height")}
          />
          <RadioGroup
            label="Единицы"
            name={unitField.name}
            options={unitOptions}
            value={unitField.value}
            disabled={isSaving}
            isModified={Boolean(dirtyFields.unit)}
            onChange={unitField.onChange}
          />
        </div>
        <Input
          className={styles.year}
          label="Год"
          hint="Когда работа закончена"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder={String(new Date().getFullYear())}
          disabled={isSaving}
          error={errors.year?.message}
          isModified={Boolean(dirtyFields.year)}
          {...register("year")}
        />
      </div>

      <PhotoFields label="Фото работы" isSaving={isSaving} serverPhoto={savedPhoto} />
    </div>
  );
}
