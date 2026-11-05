import clsx from "clsx";
import React, { type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/shared/ui/input";

import type { RowEditing } from "../model/useRowEditing";
import styles from "./TitleList.module.css";
import { TitleRowActions } from "./TitleRowActions";
import { type TitleRow, TitleRowText } from "./TitleRowText";

interface TitleListRowProps {
  editing: RowEditing;
  error: string | undefined;
  /** Anything of the row differs from the saved one, for the mark at its start. */
  isModified: boolean;
  isSaving: boolean;
  /** The title differs from the saved one, for the mark of the field. */
  isTitleModified: boolean;
  /** Names the actions and the title field of the row for the reader. */
  labels: {
    /** E.g. «Название материала Акварель». */
    field: string;
    /** The pencil, which opens the row, e.g. «Переименовать Акварель». */
    edit: string;
    /** E.g. «Удалить Акварель». */
    remove: string;
  };
  onRemove: () => void;
  row: TitleRow;
  /** Before the title, for example the swatch of a color, which may be a control while editing. */
  start?: ReactNode;
  /** The title field of the row, as the form registers it. */
  titleField: UseFormRegisterReturn;
}

/**
 * A row of a list of titles: the title, or a field while the row is edited, and its actions. The
 * editing lasts while the focus stays in the row, so a control in `start` can be used too.
 */
export function TitleListRow({
  editing: { isEditing, onCancel, onFinish, onStart },
  error,
  isModified,
  isSaving,
  isTitleModified,
  labels,
  onRemove,
  row,
  start,
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
          onFinish();
        }
      }}
      onKeyDown={(event) => {
        if (isEditing && event.key === "Escape") {
          focusEditButton.current = true;
          onCancel();
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
              onFinish();
            }
          }}
        />
      ) : (
        <TitleRowText {...row} />
      )}
      <TitleRowActions
        editButtonRef={editButtonRef}
        editLabel={labels.edit}
        isEditing={isEditing}
        isSaving={isSaving}
        onRemove={onRemove}
        onStartEdit={onStart}
        removeLabel={labels.remove}
      />
    </li>
  );
}
