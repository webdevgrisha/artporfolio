import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";

import { type GalleryMaterials, galleryMaterialsQuery, maxMaterials } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import {
  type MaterialsFormValues,
  materialsFormSchema,
  toMaterialsFormValues,
} from "../model/materialsFormSchema";
import { saveMaterialsFeedback, useSaveMaterials } from "../model/useSaveMaterials";
import { AddTitleField } from "./AddTitleField";
import { TitleList } from "./TitleList";
import styles from "./TitleList.module.css";
import { TitleListRow } from "./TitleListRow";

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
    register,
    setValue,
    trigger,
  } = form;
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, remove } = useFieldArray({ control, name: "materials" });
  const rows = useWatch({ control, name: "materials" });
  const [editing, setEditing] = React.useState<Editing>();
  const addFieldRef = React.useRef<HTMLInputElement>(null);
  const savedTitles = new Map(saved.data.materials.map(({ id, title }) => [id, title]));

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
          <AddTitleField
            ref={addFieldRef}
            disabled={editForm.isSaving}
            existingTitles={rows.map((row) => row.title)}
            labels={{
              add: "Добавить материал",
              duplicate: "Такой материал уже есть",
              field: "Новый материал",
              full: `Материалов уже ${String(maxMaterials)}, больше добавить нельзя`,
              placeholder: "Например: Акварель",
            }}
            max={maxMaterials}
            onAdd={(title) => append({ id: crypto.randomUUID(), title }, { shouldFocus: false })}
          />

          <TitleList
            heading="Материалы"
            hint={`${String(fields.length)} из ${String(maxMaterials)}. На сайте идут по алфавиту`}
            empty="Материалов пока нет"
            error={errors.materials?.message ?? errors.materials?.root?.message}
            isEmpty={fields.length === 0}
          >
            {fields.map((field, index) => {
              const row = rows[index] ?? field;
              const savedTitle = savedTitles.get(row.id);
              const isTitleModified = savedTitle !== row.title;
              const titleError = errors.materials?.[index]?.title?.message;

              return (
                <TitleListRow
                  key={field.id}
                  title={row.title}
                  titleField={register(`materials.${index}.title`)}
                  labels={{
                    field: `Название материала ${savedTitle ?? row.title}`,
                    remove: `Удалить ${row.title || "материал"}`,
                    edit: `Переименовать ${row.title}`,
                  }}
                  error={titleError}
                  isEditing={editing?.key === field.id || Boolean(titleError)}
                  isNew={savedTitle === undefined}
                  isModified={isTitleModified}
                  isTitleModified={isTitleModified}
                  isSaving={editForm.isSaving}
                  onStartEdit={() => setEditing({ key: field.id, startTitle: row.title })}
                  onFinishEdit={() => finishEdit(index)}
                  onCancelEdit={() => cancelEdit(index)}
                  onRemove={() => removeRow(index)}
                />
              );
            })}
          </TitleList>
        </div>
      </EditForm>
    </FormProvider>
  );
}
