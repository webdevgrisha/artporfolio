import clsx from "clsx";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import type { GalleryWork } from "@/entities/gallery";
import type { Photo } from "@/shared/api/photo";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { Input } from "@/shared/ui/input";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { Textarea } from "@/shared/ui/textarea";

import { type CollectionFormValues, collectionMaxLengths } from "../model/collectionFormSchema";
import styles from "./CollectionFields.module.css";
import { CollectionWorksField } from "./CollectionWorksField";

interface CollectionFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The cover of the saved collection, shown while the cover field keeps it; none for a new one. */
  savedCover: Photo | null;
  /** Every work of the gallery, in the order the site shows them. */
  works: readonly GalleryWork[];
}

/** The fields of a collection form; they read the form from its context. */
export function CollectionFields({
  className,
  isSaving,
  savedCover,
  works,
}: CollectionFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<CollectionFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  const title = useWatch({ control, name: "title" });
  // After a refused submit, react-hook-form focuses the first invalid field in the order the
  // fields were registered, so they are registered here in the order of the form; the cover comes
  // last, from its own component.
  const titleField = register("title");
  const descriptionField = register("description");
  const startYearField = register("startYear");
  const endYearField = register("endYear");
  const { field: worksField } = useController({ control, name: "workIds" });

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
          hint={`До ${String(collectionMaxLengths.title)} символов`}
          placeholder="Например: Саванна"
          disabled={isSaving}
          error={errors.title?.message}
          isModified={Boolean(dirtyFields.title)}
          hasValue={Boolean(title)}
          clearLabel="Очистить название"
          onClear={clearTitle}
          {...titleField}
        />
        <Textarea
          label="Описание"
          hint={`До ${String(collectionMaxLengths.description)} символов. Абзацы разделяйте пустой строкой`}
          placeholder="О чём коллекция и как она появилась"
          rows={8}
          disabled={isSaving}
          error={errors.description?.message}
          isModified={Boolean(dirtyFields.description)}
          {...descriptionField}
        />
        {/* The years read as a span: the start, then the end. */}
        <div className={styles.years}>
          <Input
            className={styles.year}
            label="Год начала"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder={String(new Date().getFullYear())}
            disabled={isSaving}
            error={errors.startYear?.message}
            isModified={Boolean(dirtyFields.startYear)}
            {...startYearField}
          />
          <Input
            className={styles.year}
            label="Год окончания"
            hint="Необязательно"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            disabled={isSaving}
            error={errors.endYear?.message}
            isModified={Boolean(dirtyFields.endYear)}
            {...endYearField}
          />
        </div>
        <CollectionWorksField
          works={works}
          value={worksField.value}
          disabled={isSaving}
          error={errors.workIds?.message}
          isModified={Boolean(dirtyFields.workIds)}
          onChange={worksField.onChange}
        />
      </div>

      <PhotoFields label="Обложка" isSaving={isSaving} serverPhoto={savedCover} />
    </div>
  );
}
