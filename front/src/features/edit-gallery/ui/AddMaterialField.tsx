import React from "react";

import { maxMaterials } from "@/entities/gallery";
import { PlusIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { Tooltip } from "@/shared/ui/tooltip";

import { materialTitleKey, materialTitleSchema } from "../model/materialsFormSchema";
import styles from "./EditMaterialsForm.module.css";

interface AddMaterialFieldProps {
  disabled: boolean;
  /** The titles already in the list, saved or not, to refuse one of them again. */
  existingTitles: readonly string[];
  onAdd: (title: string) => void;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * The title of a new material: Enter or the plus adds it to the list and empties the field for the
 * next one. The list is saved with «Сохранить», as a whole.
 */
export function AddMaterialField({ disabled, existingTitles, onAdd, ref }: AddMaterialFieldProps) {
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState<string>();
  const isFull = existingTitles.length >= maxMaterials;

  function add() {
    const result = materialTitleSchema.safeParse(title);

    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }

    if (existingTitles.some((existing) => materialTitleKey(existing) === materialTitleKey(title))) {
      setError("Такой материал уже есть");
      return;
    }

    onAdd(result.data);
    setTitle("");
    setError(undefined);
  }

  return (
    <Input
      ref={ref}
      label="Новый материал"
      hint={
        isFull
          ? `Материалов уже ${String(maxMaterials)}, больше добавить нельзя`
          : "Введите название и нажмите Enter"
      }
      placeholder="Например: Акварель"
      value={title}
      disabled={disabled || isFull}
      error={error}
      onChange={(event) => {
        setTitle(event.target.value);
        setError(undefined);
      }}
      onKeyDown={(event) => {
        // Enter adds the material instead of submitting the whole form.
        if (event.key === "Enter") {
          event.preventDefault();
          add();
        }
      }}
      endAdornment={
        <Tooltip className={styles.addTooltip} content="Добавить материал">
          <IconButton
            className={styles.addButton}
            label="Добавить материал"
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
