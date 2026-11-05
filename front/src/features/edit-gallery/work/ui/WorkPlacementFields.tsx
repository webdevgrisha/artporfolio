import React from "react";
import { useController, useFormContext, useFormState } from "react-hook-form";

import { Checkbox } from "@/shared/ui/checkbox";
import { FieldHint } from "@/shared/ui/field";
import { Frame, FrameRow, FrameRowLabel } from "@/shared/ui/frame-list";
import { Select } from "@/shared/ui/select";

import { toIdSet } from "../../model/idSet";
import type { WorkReferences } from "../model/useWorkReferences";
import type { WorkFormValues } from "../model/workFormSchema";
import { toCollectionOptions } from "../model/workReferences";
import { SectionsField } from "./SectionsField";
import styles from "./WorkFields.module.css";

interface WorkPlacementFieldsProps {
  collections: WorkReferences["collections"];
  isSaving: boolean;
  sections: WorkReferences["sections"];
}

/** Whether the site shows the work, and in which sections and collection. */
export function WorkPlacementFields({ collections, isSaving, sections }: WorkPlacementFieldsProps) {
  const { control } = useFormContext<WorkFormValues>();
  const { defaultValues, dirtyFields, errors } = useFormState({ control });
  // A checkbox always holds a value, so it is never invalid and needs no ref, as the format.
  const { field: publishedField } = useController({ control, name: "published" });
  const { field: sectionsField } = useController({ control, name: "sectionIds" });
  // A select, so a controller, as for the month.
  const { field: collectionField } = useController({ control, name: "collectionId" });
  const publishedId = React.useId();
  const savedSectionIds = React.useMemo(
    () => defaultValues?.sectionIds?.filter((id) => id !== undefined) ?? [],
    [defaultValues],
  );
  const collectionOptions = React.useMemo(() => toCollectionOptions(collections), [collections]);

  return (
    <>
      <div>
        <Frame className={styles.published} isModified={Boolean(dirtyFields.published)}>
          <FrameRow>
            <FrameRowLabel htmlFor={publishedId}>Показывать на сайте</FrameRowLabel>
            <Checkbox
              className={styles.publishedCheckbox}
              id={publishedId}
              aria-describedby={`${publishedId}-hint`}
              checked={publishedField.value}
              disabled={isSaving}
              onBlur={publishedField.onBlur}
              onChange={publishedField.onChange}
            />
          </FrameRow>
        </Frame>
        <FieldHint id={`${publishedId}-hint`}>
          Скрытая работа остаётся здесь, её можно показать позже
        </FieldHint>
      </div>
      <SectionsField
        sections={sections}
        value={sectionsField.value}
        savedIds={savedSectionIds}
        disabled={isSaving}
        error={errors.sectionIds?.message}
        inputRef={sectionsField.ref}
        onBlur={sectionsField.onBlur}
        onChange={(ids) => sectionsField.onChange(toIdSet(ids))}
      />
      {/* Always holds a choice, so it needs no «Необязательно»: «Без коллекции» is one. */}
      <Select
        className={styles.collection}
        label="Коллекция"
        options={collectionOptions}
        disabled={isSaving}
        error={errors.collectionId?.message}
        isModified={Boolean(dirtyFields.collectionId)}
        ref={collectionField.ref}
        value={collectionField.value}
        onBlur={collectionField.onBlur}
        onChange={collectionField.onChange}
      />
    </>
  );
}
