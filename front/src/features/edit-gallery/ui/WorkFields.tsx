import clsx from "clsx";
import React from "react";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import { type GallerySection, maxWorkProcessPhotos } from "@/entities/gallery";
import type { ListPhoto, Photo } from "@/shared/api/photo";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { Input } from "@/shared/ui/input";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { PhotoListField } from "@/shared/ui/photo-list-field";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { monthOptions, type WorkFormValues, workMaxLengths } from "../model/workFormSchema";
import { SectionsField } from "./SectionsField";
import styles from "./WorkFields.module.css";

interface WorkFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The photo of the saved work, shown while the photo field keeps it; none for a new work. */
  savedPhoto: Photo | null;
  /** The process photos of the saved work, to show that some were removed or moved. */
  savedProcessPhotos: readonly ListPhoto[];
  /** The sections of the gallery, sorted by title, to choose from. */
  sections: readonly GallerySection[];
}

/** The fields of a work form; they read the form from its context. */
export function WorkFields({
  className,
  isSaving,
  savedPhoto,
  savedProcessPhotos,
  sections,
}: WorkFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<WorkFormValues>();
  const { defaultValues, dirtyFields, errors, isSubmitted } = useFormState({ control });
  const title = useWatch({ control, name: "title" });
  // A select is not a text input: before the form is ready, react-hook-form takes its DOM value
  // for a change, so a controller keeps the value in the form's state instead (see the colours).
  const { field: monthField } = useController({ control, name: "month" });
  const { field: sectionsField } = useController({ control, name: "sectionIds" });
  const savedSectionIds = React.useMemo(
    () => defaultValues?.sectionIds?.filter((id) => id !== undefined) ?? [],
    [defaultValues],
  );

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
          hint={`До ${String(workMaxLengths.description)} символов. Абзацы разделяйте пустой строкой`}
          placeholder="О чём работа и как она сделана"
          rows={8}
          disabled={isSaving}
          error={errors.description?.message}
          isModified={Boolean(dirtyFields.description)}
          {...register("description")}
        />
        <SectionsField
          sections={sections}
          value={sectionsField.value}
          savedIds={savedSectionIds}
          disabled={isSaving}
          error={errors.sectionIds?.message}
          inputRef={sectionsField.ref}
          onBlur={sectionsField.onBlur}
          onChange={sectionsField.onChange}
        />
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
            {...register("width")}
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
            {...register("height")}
          />
        </div>
        {/* When the work was finished, as it is read: the month, then the year. */}
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
            name={monthField.name}
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
            {...register("year")}
          />
        </div>
      </div>

      <PhotoFields label="Фото работы" isSaving={isSaving} serverPhoto={savedPhoto} />

      <PhotoListField
        label="Фото процесса"
        altPlaceholder="Например: первые наброски карандашом"
        maxPhotos={maxWorkProcessPhotos}
        isSaving={isSaving}
        savedPhotos={savedProcessPhotos}
      />
    </div>
  );
}
