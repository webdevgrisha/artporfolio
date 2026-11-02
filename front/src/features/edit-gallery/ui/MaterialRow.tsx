import clsx from "clsx";
import React from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import { EditIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { Tooltip } from "@/shared/ui/tooltip";

import type { MaterialsFormValues } from "../model/materialsFormSchema";
import styles from "./EditMaterialsForm.module.css";

interface MaterialRowProps {
  index: number;
  isEditing: boolean;
  isSaving: boolean;
  /** Keeps the new title. */
  onFinishEdit: () => void;
  /** Brings back the title the editing started from. */
  onCancelEdit: () => void;
  onRemove: () => void;
  onStartEdit: () => void;
  /** The title as saved on the server; none for a material added since. */
  savedTitle: string | undefined;
}

/** A material of the list: its title, or a field while it is renamed, and its actions. */
export function MaterialRow({
  index,
  isEditing,
  isSaving,
  onCancelEdit,
  onFinishEdit,
  onRemove,
  onStartEdit,
  savedTitle,
}: MaterialRowProps) {
  const { control, register } = useFormContext<MaterialsFormValues>();
  const { errors } = useFormState({ control, name: `materials.${index}.title` });
  const title = useWatch({ control, name: `materials.${index}.title` });
  const editButtonRef = React.useRef<HTMLButtonElement>(null);
  // Set when Enter or Escape ends the editing: the field goes, so the focus returns to the pencil.
  const focusEditButton = React.useRef(false);
  const field = register(`materials.${index}.title`);
  const isNew = savedTitle === undefined;
  const isModified = isNew || savedTitle !== title;
  const editLabel = `Переименовать ${title}`;
  const removeLabel = `Удалить ${title || "материал"}`;

  React.useEffect(() => {
    if (!isEditing && focusEditButton.current) {
      focusEditButton.current = false;
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <li className={clsx(styles.row, isModified && styles.rowModified)}>
      {isEditing ? (
        <Input
          {...field}
          className={styles.rowField}
          label="Название"
          aria-label={`Название материала ${savedTitle ?? title}`}
          disabled={isSaving}
          error={errors.materials?.[index]?.title?.message}
          isModified={isModified}
          // The field opens on the pencil, which goes away; the focus moves into the field.
          autoFocus
          onBlur={(event) => {
            void field.onBlur(event);
            onFinishEdit();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              // Enter ends the renaming instead of submitting the whole form.
              event.preventDefault();
              focusEditButton.current = true;
              onFinishEdit();
            } else if (event.key === "Escape") {
              focusEditButton.current = true;
              onCancelEdit();
            }
          }}
        />
      ) : (
        <span className={styles.rowTitle}>
          {title}
          {isNew ? <span className={styles.rowNote}> — новый</span> : null}
        </span>
      )}

      <div className={styles.rowActions}>
        {isEditing ? null : (
          <Tooltip content={editLabel}>
            <IconButton
              ref={editButtonRef}
              label={editLabel}
              disabled={isSaving}
              onClick={onStartEdit}
            >
              <EditIcon className={styles.actionIcon} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip content={removeLabel}>
          <IconButton
            label={removeLabel}
            disabled={isSaving}
            // Keeps the field from ending the renaming first, which would move the focus.
            onMouseDown={(event) => event.preventDefault()}
            onClick={onRemove}
          >
            <TrashIcon className={styles.actionIcon} />
          </IconButton>
        </Tooltip>
      </div>
    </li>
  );
}
