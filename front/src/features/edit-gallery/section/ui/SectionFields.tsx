import clsx from "clsx";
import React from "react";
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";

import { maxSubsections, type Subsection, type WorkUsages } from "@/entities/gallery";
import { useFocusAfterUpdate } from "@/shared/lib/useFocusAfterUpdate";
import { Button } from "@/shared/ui/button";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-dialog";
import { FieldError, FieldHint } from "@/shared/ui/field";
import { maxTitleLength } from "../../model/titles";
import { useRowRemoval } from "../../model/useRowRemoval";
import { describeWorkUsage, formatWorkCount, noWorkUsage, usageOf } from "../../model/workUsage";
import { newSubsection, type SectionFormValues } from "../model/sectionFormSchema";
import styles from "./SectionFields.module.css";

interface SectionFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The subsections of the saved section, to mark the changed ones; none for a new section. */
  savedSubsections: readonly Subsection[];
  /** How many works each saved subsection has, by its id; none for a new section. */
  usages: WorkUsages;
}

/**
 * The title of a section and its subsections; they read the form from its context. Subsections
 * are listed on the site by title, so they have no order to set: a row is added or removed. A
 * saved subsection tells how many works are in it, and its removal asks first if any are.
 */
export function SectionFields({
  className,
  isSaving,
  savedSubsections,
  usages,
}: SectionFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<SectionFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, remove } = useFieldArray({ control, name: "subsections" });
  const [title, rows] = useWatch({ control, name: ["title", "subsections"] });
  const addButtonRef = React.useRef<HTMLButtonElement>(null);
  const hintId = React.useId();
  const errorId = React.useId();
  const focusAfterUpdate = useFocusAfterUpdate();
  const savedTitles = new Map(savedSubsections.map(({ id, title }) => [id, title]));
  const listError = errors.subsections?.message ?? errors.subsections?.root?.message;
  const isFull = fields.length >= maxSubsections;
  const removal = useRowRemoval((index) => {
    const lastIndex = fields.length - 2;

    remove(index);
    // The next row takes the place of the removed one; after the last row, the add button.
    focusAfterUpdate(() => {
      if (lastIndex >= 0) {
        setFocus(`subsections.${Math.min(index, lastIndex)}.title`);
      } else {
        addButtonRef.current?.focus();
      }
    });
  });
  const removedTitle = removal.pending ? rows[removal.pending.index]?.title : undefined;

  function clearTitle() {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue("title", "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus("title");
  }

  return (
    <div className={clsx(styles.root, className)}>
      <ClearableInput
        label="Название раздела"
        hint={`До ${String(maxTitleLength)} символов`}
        placeholder="Например: Постеры"
        disabled={isSaving}
        error={errors.title?.message}
        isModified={Boolean(dirtyFields.title)}
        hasValue={Boolean(title)}
        clearLabel="Очистить название"
        onClear={clearTitle}
        {...register("title")}
      />

      <fieldset
        className={styles.subsections}
        aria-describedby={clsx(hintId, listError && errorId)}
      >
        <legend className={styles.legend}>Подразделы</legend>
        <FieldHint id={hintId}>
          {`Необязательно. На сайте идут по алфавиту. ${String(fields.length)} из ${String(maxSubsections)}`}
        </FieldHint>

        {fields.length > 0 ? (
          <ul className={styles.rows}>
            {fields.map((field, index) => {
              const row = rows[index];
              const label = `Подраздел ${String(index + 1)}`;
              const usage = row ? usageOf(usages, row.id) : noWorkUsage;
              const isSaved = row !== undefined && savedTitles.has(row.id);

              return (
                <li key={field.id}>
                  <ClearableInput
                    label={label}
                    placeholder="Например: Театральные"
                    hint={isSaved ? formatWorkCount(usage.count) : undefined}
                    disabled={isSaving}
                    error={errors.subsections?.[index]?.title?.message}
                    isModified={row !== undefined && savedTitles.get(row.id) !== row.title}
                    // The button removes the whole row, not only its text.
                    hasValue
                    clearLabel={`Удалить ${row?.title ? `подраздел «${row.title}»` : label}`}
                    onClear={() => removal.request(index, usage)}
                    {...register(`subsections.${index}.title`)}
                  />
                </li>
              );
            })}
          </ul>
        ) : null}

        {listError ? <FieldError id={errorId}>{listError}</FieldError> : null}

        <Button
          ref={addButtonRef}
          className={styles.addButton}
          disabled={isSaving || isFull}
          // The focus goes to the title of the new row.
          onClick={() => append(newSubsection())}
        >
          Добавить подраздел
        </Button>
      </fieldset>

      <ConfirmDeleteDialog
        isOpen={removal.pending !== undefined}
        title={`Удалить подраздел «${removedTitle ?? ""}»?`}
        description={
          removal.pending
            ? describeWorkUsage(removal.pending.usage, { item: "раздел", others: "разделов" })
            : ""
        }
        onCancel={removal.cancel}
        onConfirm={removal.confirm}
      />
    </div>
  );
}
