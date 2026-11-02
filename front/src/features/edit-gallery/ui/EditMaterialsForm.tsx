import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";

import { type GalleryMaterials, galleryMaterialsQuery } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { FieldError } from "@/shared/ui/field";

import {
  type MaterialsFormValues,
  materialsFormSchema,
  toMaterialsFormValues,
} from "../model/materialsFormSchema";
import { saveMaterialsFeedback, useSaveMaterials } from "../model/useSaveMaterials";
import { AddMaterialField } from "./AddMaterialField";
import styles from "./EditMaterialsForm.module.css";
import { MaterialRow } from "./MaterialRow";

interface EditMaterialsFormProps {
  className?: string;
  /** The materials as stored on the server when the form opens, with their ETag. */
  materials: Tagged<GalleryMaterials>;
}

/** The material being renamed: the key of its row and the title the renaming started from. */
interface Editing {
  key: string;
  startTitle: string;
}

/**
 * Every material of the gallery, as one list: a material is added, renamed or removed here, and
 * «Сохранить» sends the whole list. The site lists the materials by title, and so does the list
 * once it is saved; the materials added since stay at its end until then.
 */
export function EditMaterialsForm({ className, materials }: EditMaterialsFormProps) {
  const form = useForm<MaterialsFormValues>({
    defaultValues: toMaterialsFormValues(materials.data),
    resolver: zodResolver(materialsFormSchema),
  });
  const saveMaterials = useSaveMaterials();
  const { editForm, saved } = useSavedForm({
    form,
    initial: materials,
    query: galleryMaterialsQuery,
    save: (values, etag) => saveMaterials.mutateAsync({ etag, materials: values }),
    toValues: toMaterialsFormValues,
    toastId: saveMaterialsFeedback.toastId,
  });
  const {
    control,
    formState: { errors, isSubmitted },
    setValue,
    trigger,
  } = form;
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, remove } = useFieldArray({ control, name: "materials" });
  const rows = useWatch({ control, name: "materials" });
  const [editing, setEditing] = React.useState<Editing>();
  const addFieldRef = React.useRef<HTMLInputElement>(null);
  const headingId = React.useId();
  const errorId = React.useId();
  const savedTitles = new Map(saved.data.materials.map(({ id, title }) => [id, title]));
  const listError = errors.materials?.message ?? errors.materials?.root?.message;

  function finishEdit(index: number) {
    setEditing(undefined);
    // A row with an invalid title stays open until it is fixed.
    void trigger(`materials.${index}.title`);
  }

  function cancelEdit(index: number) {
    if (editing) {
      setValue(`materials.${index}.title`, editing.startTitle, {
        shouldDirty: true,
        shouldValidate: isSubmitted,
      });
    }
    setEditing(undefined);
  }

  function removeRow(index: number) {
    remove(index);
    setEditing(undefined);
    // The row and its buttons are gone; the next material is added from the field above.
    addFieldRef.current?.focus();
  }

  return (
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <div className={styles.root}>
          <AddMaterialField
            ref={addFieldRef}
            disabled={editForm.isSaving}
            existingTitles={rows.map((row) => row.title)}
            onAdd={(title) => append({ id: crypto.randomUUID(), title }, { shouldFocus: false })}
          />

          <section
            className={styles.list}
            aria-labelledby={headingId}
            aria-describedby={listError ? errorId : undefined}
          >
            <h2 id={headingId} className={styles.heading}>
              {`Материалы: ${String(fields.length)}`}
            </h2>
            {fields.length === 0 ? (
              <p className={styles.empty}>Материалов пока нет</p>
            ) : (
              <ul className={styles.rows}>
                {fields.map((field, index) => {
                  const row = rows[index] ?? field;

                  return (
                    <MaterialRow
                      key={field.id}
                      index={index}
                      isEditing={
                        editing?.key === field.id || Boolean(errors.materials?.[index]?.title)
                      }
                      isSaving={editForm.isSaving}
                      savedTitle={savedTitles.get(row.id)}
                      onStartEdit={() => setEditing({ key: field.id, startTitle: row.title })}
                      onFinishEdit={() => finishEdit(index)}
                      onCancelEdit={() => cancelEdit(index)}
                      onRemove={() => removeRow(index)}
                    />
                  );
                })}
              </ul>
            )}
            {listError ? <FieldError id={errorId}>{listError}</FieldError> : null}
          </section>
        </div>
      </EditForm>
    </FormProvider>
  );
}
