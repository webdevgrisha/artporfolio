import clsx from "clsx";
import React, { type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { EditIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./TitleList.module.css";

interface TitleListRowProps {
  /** Names the actions and the title field of the row for the reader. */
  labels: {
    /** E.g. «Название материала Акварель». */
    field: string;
    /** E.g. «Переименовать Акварель». */
    rename: string;
    /** E.g. «Удалить Акварель». */
    remove: string;
  };
  error: string | undefined;
  isEditing: boolean;
  /** Added since the save: none of it is on the server yet. */
  isNew: boolean;
  /** Anything of the row differs from the saved one, for the mark at its start. */
  isModified: boolean;
  isSaving: boolean;
  /** The title differs from the saved one, for the mark of the field. */
  isTitleModified: boolean;
  /** Keeps the new title. */
  onFinishEdit: () => void;
  /** Brings back the title the editing started from. */
  onCancelEdit: () => void;
  onRemove: () => void;
  onStartEdit: () => void;
  /** Before the title, for example the swatch of a color. */
  start?: ReactNode;
  title: string;
  /** The title field of the row, as the form registers it. */
  titleField: UseFormRegisterReturn;
}

/** A row of a list of titles: the title, or a field while it is renamed, and its actions. */
export function TitleListRow({
  error,
  isEditing,
  isModified,
  isNew,
  isSaving,
  isTitleModified,
  labels,
  onCancelEdit,
  onFinishEdit,
  onRemove,
  onStartEdit,
  start,
  title,
  titleField,
}: TitleListRowProps) {
  const editButtonRef = React.useRef<HTMLButtonElement>(null);
  // Set when Enter or Escape ends the editing: the field goes, so the focus returns to the pencil.
  const focusEditButton = React.useRef(false);

  React.useEffect(() => {
    if (!isEditing && focusEditButton.current) {
      focusEditButton.current = false;
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <li className={clsx(styles.row, isModified && styles.rowModified)}>
      {start}

      {isEditing ? (
        <Input
          {...titleField}
          className={styles.rowField}
          label="Название"
          aria-label={labels.field}
          disabled={isSaving}
          error={error}
          isModified={isTitleModified}
          // The field opens on the pencil, which goes away; the focus moves into the field.
          autoFocus
          onBlur={(event) => {
            void titleField.onBlur(event);
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
          <Tooltip content={labels.rename}>
            <IconButton
              ref={editButtonRef}
              label={labels.rename}
              disabled={isSaving}
              onClick={onStartEdit}
            >
              <EditIcon className={styles.actionIcon} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip content={labels.remove}>
          <IconButton
            label={labels.remove}
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
