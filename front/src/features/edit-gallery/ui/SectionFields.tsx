import clsx from "clsx";
import React from "react";
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";

import { maxSubsections, type Subsection } from "@/entities/gallery";
import { Button } from "@/shared/ui/button";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { FieldError, FieldHint } from "@/shared/ui/field";

import { newSubsection, type SectionFormValues } from "../model/sectionFormSchema";
import { maxTitleLength } from "../model/titles";
import styles from "./SectionFields.module.css";

interface SectionFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The subsections of the saved section, to mark the changed ones; none for a new section. */
  savedSubsections: readonly Subsection[];
}

/**
 * The title of a section and its subsections; they read the form from its context. Subsections
 * are listed on the site by title, so they have no order to set: a row is added or removed.
 */
export function SectionFields({ className, isSaving, savedSubsections }: SectionFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<SectionFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, remove } = useFieldArray({ control, name: "subsections" });
  const [title, rows] = useWatch({ control, name: ["title", "subsections"] });
  const addButtonRef = React.useRef<HTMLButtonElement>(null);
  const hintId = React.useId();
  const errorId = React.useId();
  // The row whose place gets the focus once a removed row has left the list.
  const [focusAfterRemove, setFocusAfterRemove] = React.useState<number>();
  const savedTitles = new Map(savedSubsections.map(({ id, title }) => [id, title]));
  const listError = errors.subsections?.message ?? errors.subsections?.root?.message;
  const isFull = fields.length >= maxSubsections;

  React.useEffect(() => {
    if (focusAfterRemove === undefined) return;

    // The next row takes the place of the removed one; after the last row, the add button.
    if (fields.length > 0) {
      setFocus(`subsections.${Math.min(focusAfterRemove, fields.length - 1)}.title`);
    } else {
      addButtonRef.current?.focus();
    }
    setFocusAfterRemove(undefined);
  }, [fields.length, focusAfterRemove, setFocus]);

  function clearTitle() {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue("title", "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus("title");
  }

  function removeRow(index: number) {
    remove(index);
    setFocusAfterRemove(index);
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

              return (
                <li key={field.id}>
                  <ClearableInput
                    label={label}
                    placeholder="Например: Театральные"
                    disabled={isSaving}
                    error={errors.subsections?.[index]?.title?.message}
                    isModified={row !== undefined && savedTitles.get(row.id) !== row.title}
                    // The button removes the whole row, not only its text.
                    hasValue
                    clearLabel={`Удалить ${row?.title ? `подраздел «${row.title}»` : label}`}
                    onClear={() => removeRow(index)}
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
    </div>
  );
}
