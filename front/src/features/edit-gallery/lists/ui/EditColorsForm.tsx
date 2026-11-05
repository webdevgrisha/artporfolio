import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";

import {
  type GalleryColors,
  galleryColorsQuery,
  galleryWorkUsageQuery,
  maxColors,
  type WorkUsages,
} from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { useFocusAfterUpdate } from "@/shared/lib/useFocusAfterUpdate";
import { ColorSwatch, ColorSwatchInput } from "@/shared/ui/color-swatch";
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
import { saveColorsFeedback, useSaveColors } from "../model/useSaveColors";
import { AddTitleField } from "./AddTitleField";
import { TitleList } from "./TitleList";
import styles from "./TitleList.module.css";
import { TitleListRow } from "./TitleListRow";

interface EditColorsFormProps {
  className?: string;
  /** The colors as stored on the server when the form opens, with their ETag. */
  colors: Tagged<GalleryColors>;
  /** How many works have each color, by its id. */
  usages: WorkUsages;
}

/** The color being edited: the key of its row and the title and swatch the editing started from. */
interface Editing {
  key: string;
  startHex: string;
  startTitle: string;
}

/**
 * Every color of the gallery, as one list: a color is added with its swatch, edited (its title and
 * its swatch, after the pencil) or removed here, and «Сохранить» sends the whole list. A color is one swatch: a
 * black-and-white work gets «Чёрный» and «Белый». The site lists the colors by title, and so does
 * the list once it is saved; the colors added since stay at its end until then. A color tells how
 * many works have it, and its removal asks first if any do.
 */
export function EditColorsForm({ className, colors, usages }: EditColorsFormProps) {
  const form = useForm<ColorsFormValues>({
    defaultValues: toColorsFormValues(colors.data),
    resolver: zodResolver(colorsFormSchema),
  });
  const saveColors = useSaveColors();
  const { editForm, saved } = useSavedForm({
    form,
    initial: colors,
    query: galleryColorsQuery,
    related: [galleryWorkUsageQuery.queryKey],
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
  const [editing, setEditing] = React.useState<Editing>();
  // The swatch of the color being added; each new color starts from the neutral one.
  const [newHex, setNewHex] = React.useState(defaultColorHex);
  const addFieldRef = React.useRef<HTMLInputElement>(null);
  const savedColors = new Map(saved.data.map((color) => [color.id, color]));
  const focusAfterUpdate = useFocusAfterUpdate();
  const removal = useRowRemoval((index) => {
    remove(index);
    setEditing(undefined);
    // The row and its buttons are gone; the next color is added from the field above.
    focusAfterUpdate(() => addFieldRef.current?.focus());
  });
  const removedTitle = removal.pending ? rows[removal.pending.index]?.title : undefined;

  function finishEdit(index: number) {
    setEditing(undefined);
    // A row with an invalid title stays open until it is fixed.
    void trigger(`colors.${index}.title`);
  }

  function cancelEdit(index: number) {
    if (editing) {
      setValue(`colors.${index}.title`, editing.startTitle, {
        shouldDirty: true,
        shouldValidate: isSubmitted,
      });
      setValue(`colors.${index}.hex`, editing.startHex, { shouldDirty: true });
    }
    setEditing(undefined);
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
              const isEditing = editing?.key === field.id || Boolean(titleError);
              const swatchLabel = `Образец цвета ${row.title}`;

              return (
                <TitleListRow
                  key={field.id}
                  title={row.title}
                  titleField={register(`colors.${index}.title`)}
                  start={
                    // The swatch changes after the pencil, as the title does.
                    isEditing ? (
                      <Tooltip content={swatchLabel}>
                        {/* Controlled: an uncontrolled color input shows #000000 before the form
                          fills it, and the form would take that for a value the user picked. */}
                        <Controller
                          control={control}
                          name={`colors.${index}.hex`}
                          render={({ field: swatch }) => (
                            <ColorSwatchInput
                              {...swatch}
                              label={swatchLabel}
                              disabled={editForm.isSaving}
                            />
                          )}
                        />
                      </Tooltip>
                    ) : (
                      <ColorSwatch hex={row.hex} />
                    )
                  }
                  labels={{
                    field: `Название цвета ${savedColor?.title ?? row.title}`,
                    remove: `Удалить ${row.title || "цвет"}`,
                    edit: `Изменить ${row.title}`,
                  }}
                  error={titleError}
                  isEditing={isEditing}
                  isNew={savedColor === undefined}
                  isModified={isTitleModified || savedColor?.hex !== row.hex}
                  isTitleModified={isTitleModified}
                  isSaving={editForm.isSaving}
                  onStartEdit={() =>
                    setEditing({ key: field.id, startHex: row.hex, startTitle: row.title })
                  }
                  onFinishEdit={() => finishEdit(index)}
                  onCancelEdit={() => cancelEdit(index)}
                  workCount={savedColor === undefined ? undefined : usageOf(usages, row.id).count}
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
  );
}
