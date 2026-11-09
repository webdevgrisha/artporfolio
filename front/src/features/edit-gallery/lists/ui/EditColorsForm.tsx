import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";

import { type GalleryColors, maxColors, type WorkUsages } from "@/entities/gallery";
import { type LanguageFormSlot, translationResources } from "@/entities/translation";
import type { Tagged } from "@/shared/api/http";
import { useFocusAfterUpdate } from "@/shared/lib/useFocusAfterUpdate";
import { ColorSwatchInput } from "@/shared/ui/color-swatch";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-dialog";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { Tooltip } from "@/shared/ui/tooltip";
import { useRowRemoval } from "../../model/useRowRemoval";
import { describeWorkUsage, usageOf } from "../../model/workUsage";
import {
  type ColorsFormValues,
  colorsFormSchema,
  defaultColorHex,
  toColorsFormValues,
} from "../model/colorsFormSchema";
import { useRowEditing } from "../model/useRowEditing";
import { saveColorsFeedback, useSaveColors } from "../model/useSaveColors";
import { AddTitleField } from "./AddTitleField";
import { ColorRowSwatch } from "./ColorRowSwatch";
import { TitleList } from "./TitleList";
import styles from "./TitleList.module.css";
import { TitleListRow } from "./TitleListRow";

interface EditColorsFormProps {
  className?: string;
  /** Puts the form beside its translations. */
  languageForm: LanguageFormSlot;
  /** The colors as stored on the server when the form opens, with their ETag. */
  colors: Tagged<GalleryColors>;
  /** How many works have each color, by its id. */
  usages: WorkUsages;
}

/** What the editing of a color started from. */
interface ColorStart {
  hex: string;
  title: string;
}

/**
 * Every color of the gallery, as one list: a color is added with its swatch, edited (its title and
 * its swatch, after the pencil) or removed here, and «Сохранить» sends the whole list. A color is one swatch: a
 * black-and-white work gets «Чёрный» and «Белый». The site lists the colors by title, and so does
 * the list once it is saved; the colors added since stay at its end until then. A color tells how
 * many works have it, and its removal asks first if any do.
 */
export function EditColorsForm({
  className,
  languageForm: LanguageForm,
  colors,
  usages,
}: EditColorsFormProps) {
  const form = useForm<ColorsFormValues>({
    defaultValues: toColorsFormValues(colors.data),
    resolver: zodResolver(colorsFormSchema),
  });
  const saveColors = useSaveColors();
  const { editForm, saved } = useSavedForm({
    form,
    initial: colors,
    save: (values, etag) => saveColors.mutateAsync({ colors: values.colors, etag }),
    toValues: toColorsFormValues,
    toastId: saveColorsFeedback.toastId,
  });
  const {
    control,
    formState: { errors, isSubmitted },
    register,
    setValue,
    trigger,
  } = form;
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, remove } = useFieldArray({ control, name: "colors" });
  const rows = useWatch({ control, name: "colors" });
  const { rowEditing, stopEditing } = useRowEditing<ColorStart>({
    restore: (index, { hex, title }) => {
      setValue(`colors.${index}.title`, title, { shouldDirty: true, shouldValidate: isSubmitted });
      setValue(`colors.${index}.hex`, hex, { shouldDirty: true });
    },
    validate: (index) => void trigger(`colors.${index}.title`),
  });
  // The swatch of the color being added; each new color starts from the neutral one.
  const [newHex, setNewHex] = React.useState(defaultColorHex);
  const addFieldRef = React.useRef<HTMLInputElement>(null);
  const savedColors = new Map(saved.data.map((color) => [color.id, color]));
  const focusAfterUpdate = useFocusAfterUpdate();
  const removal = useRowRemoval((index) => {
    remove(index);
    stopEditing();
    // The row and its buttons are gone; the next color is added from the field above.
    focusAfterUpdate(() => addFieldRef.current?.focus());
  });
  const removedTitle = removal.pending ? rows[removal.pending.index]?.title : undefined;

  return (
    <LanguageForm
      resource={translationResources.galleryColors}
      fields={saved.data.map(({ id, title }) => ({ key: id, label: title }))}
    >
      <FormProvider {...form}>
        <EditForm className={className} {...editForm}>
          <div className={styles.root}>
            <AddTitleField
              ref={addFieldRef}
              disabled={editForm.isSaving}
              existingTitles={rows.map((row) => row.title)}
              labels={{
                add: "Добавить цвет",
                duplicate: "Такой цвет уже есть",
                field: "Новый цвет",
                full: `Цветов уже ${String(maxColors)}, больше добавить нельзя`,
                placeholder: "Например: Синий",
              }}
              max={maxColors}
              startAdornment={
                <Tooltip content="Образец нового цвета">
                  <ColorSwatchInput
                    label="Образец нового цвета"
                    value={newHex}
                    disabled={editForm.isSaving || rows.length >= maxColors}
                    onChange={(event) => setNewHex(event.target.value)}
                  />
                </Tooltip>
              }
              onAdd={(title) => {
                append({ hex: newHex, id: crypto.randomUUID(), title }, { shouldFocus: false });
                setNewHex(defaultColorHex);
              }}
            />

            <TitleList
              heading="Цвета"
              hint={`${String(fields.length)} из ${String(maxColors)}. На сайте идут по алфавиту`}
              empty="Цветов пока нет"
              error={errors.colors?.message ?? errors.colors?.root?.message}
              isEmpty={fields.length === 0}
            >
              {fields.map((field, index) => {
                const row = rows[index] ?? field;
                const savedColor = savedColors.get(row.id);
                const isTitleModified = savedColor?.title !== row.title;
                const titleError = errors.colors?.[index]?.title?.message;
                const editing = rowEditing(
                  field.id,
                  index,
                  { hex: row.hex, title: row.title },
                  Boolean(titleError),
                );

                return (
                  <TitleListRow
                    key={field.id}
                    row={{
                      isNew: savedColor === undefined,
                      title: row.title,
                      workCount:
                        savedColor === undefined ? undefined : usageOf(usages, row.id).count,
                    }}
                    titleField={register(`colors.${index}.title`)}
                    start={
                      <ColorRowSwatch
                        disabled={editForm.isSaving}
                        hex={row.hex}
                        index={index}
                        isEditing={editing.isEditing}
                        label={`Образец цвета ${row.title}`}
                      />
                    }
                    labels={{
                      field: `Название цвета ${savedColor?.title ?? row.title}`,
                      remove: `Удалить ${row.title || "цвет"}`,
                      edit: `Изменить ${row.title}`,
                    }}
                    editing={editing}
                    error={titleError}
                    isModified={isTitleModified || savedColor?.hex !== row.hex}
                    isTitleModified={isTitleModified}
                    isSaving={editForm.isSaving}
                    onRemove={() => removal.request(index, usageOf(usages, row.id))}
                  />
                );
              })}
            </TitleList>
          </div>

          <ConfirmDeleteDialog
            isOpen={removal.pending !== undefined}
            title={`Удалить цвет «${removedTitle ?? ""}»?`}
            description={
              removal.pending
                ? describeWorkUsage(removal.pending.usage, { item: "цвет", others: "цветов" })
                : ""
            }
            onCancel={removal.cancel}
            onConfirm={removal.confirm}
          />
        </EditForm>
      </FormProvider>
    </LanguageForm>
  );
}
