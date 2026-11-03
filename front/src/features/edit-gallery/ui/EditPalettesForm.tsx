import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";

import { type GalleryPalettes, galleryPalettesQuery, maxPalettes } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import {
  type PalettesFormValues,
  palettesFormSchema,
  toPalettesFormValues,
} from "../model/palettesFormSchema";
import { savePalettesFeedback, useSavePalettes } from "../model/useSavePalettes";
import { AddTitleField } from "./AddTitleField";
import { TitleList } from "./TitleList";
import styles from "./TitleList.module.css";
import { TitleListRow } from "./TitleListRow";

interface EditPalettesFormProps {
  className?: string;
  /** The palettes as stored on the server when the form opens, with their ETag. */
  palettes: Tagged<GalleryPalettes>;
}

/** The palette being renamed: the key of its row and the title the renaming started from. */
interface Editing {
  key: string;
  startTitle: string;
}

/**
 * Every palette of the gallery (the coloring of a work as a whole), as one list: a palette is
 * added, renamed or removed here, and «Сохранить» sends the whole list. The site lists the
 * palettes by title, and so does the list once it is saved; the palettes added since stay at its
 * end until then.
 */
export function EditPalettesForm({ className, palettes }: EditPalettesFormProps) {
  const form = useForm<PalettesFormValues>({
    defaultValues: toPalettesFormValues(palettes.data),
    resolver: zodResolver(palettesFormSchema),
  });
  const savePalettes = useSavePalettes();
  const { editForm, saved } = useSavedForm({
    form,
    initial: palettes,
    query: galleryPalettesQuery,
    save: (values, etag) => savePalettes.mutateAsync({ etag, palettes: values }),
    toValues: toPalettesFormValues,
    toastId: savePalettesFeedback.toastId,
  });
  const {
    control,
    formState: { errors, isSubmitted },
    register,
    setValue,
    trigger,
  } = form;
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, remove } = useFieldArray({ control, name: "palettes" });
  const rows = useWatch({ control, name: "palettes" });
  const [editing, setEditing] = React.useState<Editing>();
  const addFieldRef = React.useRef<HTMLInputElement>(null);
  const savedTitles = new Map(saved.data.palettes.map(({ id, title }) => [id, title]));

  function finishEdit(index: number) {
    setEditing(undefined);
    // A row with an invalid title stays open until it is fixed.
    void trigger(`palettes.${index}.title`);
  }

  function cancelEdit(index: number) {
    if (editing) {
      setValue(`palettes.${index}.title`, editing.startTitle, {
        shouldDirty: true,
        shouldValidate: isSubmitted,
      });
    }
    setEditing(undefined);
  }

  function removeRow(index: number) {
    remove(index);
    setEditing(undefined);
    // The row and its buttons are gone; the next palette is added from the field above.
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
              add: "Добавить палитру",
              duplicate: "Такая палитра уже есть",
              field: "Новая палитра",
              full: `Палитр уже ${String(maxPalettes)}, больше добавить нельзя`,
              placeholder: "Например: Пастельная",
            }}
            max={maxPalettes}
            onAdd={(title) => append({ id: crypto.randomUUID(), title }, { shouldFocus: false })}
          />

          <TitleList
            heading="Палитры"
            hint={`${String(fields.length)} из ${String(maxPalettes)}. На сайте идут по алфавиту`}
            empty="Палитр пока нет"
            error={errors.palettes?.message ?? errors.palettes?.root?.message}
            isEmpty={fields.length === 0}
          >
            {fields.map((field, index) => {
              const row = rows[index] ?? field;
              const savedTitle = savedTitles.get(row.id);
              const isTitleModified = savedTitle !== row.title;
              const titleError = errors.palettes?.[index]?.title?.message;

              return (
                <TitleListRow
                  key={field.id}
                  title={row.title}
                  titleField={register(`palettes.${index}.title`)}
                  labels={{
                    field: `Название палитры ${savedTitle ?? row.title}`,
                    remove: `Удалить ${row.title || "палитру"}`,
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
