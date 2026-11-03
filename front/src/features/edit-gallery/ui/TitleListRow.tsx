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
    /** The pencil, which opens the row, e.g. «Переименовать Акварель». */
    edit: string;
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
  /** Keeps the changes: the focus has left the row, or Enter was pressed in the title. */
  onFinishEdit: () => void;
  /** Brings back what the editing started from: Escape anywhere in the row. */
  onCancelEdit: () => void;
  onRemove: () => void;
  onStartEdit: () => void;
  /** Before the title, for example the swatch of a color, which may be a control while editing. */
  start?: ReactNode;
  title: string;
  /** The title field of the row, as the form registers it. */
  titleField: UseFormRegisterReturn;
}

/**
 * A row of a list of titles: the title, or a field while the row is edited, and its actions. The
 * editing lasts while the focus stays in the row, so a control in `start` can be used too.
 */
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
    <li
      className={clsx(styles.row, isModified && styles.rowModified)}
      onBlur={(event) => {
        // A dialog of the browser, such as the color picker, takes the focus from the page only:
        // the editing goes on.
        if (
          isEditing &&
          document.hasFocus() &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          onFinishEdit();
        }
      }}
      onKeyDown={(event) => {
        if (isEditing && event.key === "Escape") {
          focusEditButton.current = true;
          onCancelEdit();
        }
      }}
    >
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
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              // Enter ends the editing instead of submitting the whole form.
              event.preventDefault();
              focusEditButton.current = true;
              onFinishEdit();
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
          <Tooltip content={labels.edit}>
            <IconButton
              ref={editButtonRef}
              label={labels.edit}
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
            // Keeps the click from moving the focus first, which would end the editing.
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
