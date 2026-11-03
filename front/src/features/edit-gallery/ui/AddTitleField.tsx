import React, { type ReactNode } from "react";

import { PlusIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { Tooltip } from "@/shared/ui/tooltip";

import { titleKey, titleSchema } from "../model/titles";
import styles from "./TitleList.module.css";

interface AddTitleFieldProps {
  disabled: boolean;
  /** The titles already in the list, saved or not, to refuse one of them again. */
  existingTitles: readonly string[];
  labels: {
    /** The action of the plus, e.g. «Добавить материал». */
    add: string;
    /** E.g. «Такой материал уже есть». */
    duplicate: string;
    /** The label of the field, e.g. «Новый материал». */
    field: string;
    /** The hint once the list holds `max` titles. */
    full: string;
    /** E.g. «Например: Акварель». */
    placeholder: string;
  };
  /** The most titles the list may hold. */
  max: number;
  onAdd: (title: string) => void;
  ref?: React.Ref<HTMLInputElement>;
  /** Before the title, for example the swatch of the new color. */
  startAdornment?: ReactNode;
}

/**
 * The title of a new row of a list: Enter or the plus adds it and empties the field for the next
 * one. The list is saved with «Сохранить», as a whole.
 */
export function AddTitleField({
  disabled,
  existingTitles,
  labels,
  max,
  onAdd,
  ref,
  startAdornment,
}: AddTitleFieldProps) {
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState<string>();
  const isFull = existingTitles.length >= max;

  function add() {
    const result = titleSchema.safeParse(title);

    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }

    if (existingTitles.some((existing) => titleKey(existing) === titleKey(title))) {
      setError(labels.duplicate);
      return;
    }

    onAdd(result.data);
    setTitle("");
    setError(undefined);
  }

  return (
    <Input
      ref={ref}
      label={labels.field}
      hint={isFull ? labels.full : "Введите название и нажмите +"}
      placeholder={labels.placeholder}
      value={title}
      disabled={disabled || isFull}
      error={error}
      onChange={(event) => {
        setTitle(event.target.value);
        setError(undefined);
      }}
      startAdornment={startAdornment}
      onKeyDown={(event) => {
        // Enter adds the row instead of submitting the whole form.
        if (event.key === "Enter") {
          event.preventDefault();
          add();
        }
      }}
      endAdornment={
        <Tooltip className={styles.addTooltip} content={labels.add}>
          <IconButton
            className={styles.addButton}
            label={labels.add}
            disabled={disabled || isFull}
            onClick={add}
          >
            <PlusIcon className={styles.addIcon} />
          </IconButton>
        </Tooltip>
      }
    />
  );
}
