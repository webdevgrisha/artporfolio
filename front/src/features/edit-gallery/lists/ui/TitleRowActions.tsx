import type { Ref } from "react";

import { EditIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./TitleList.module.css";

interface TitleRowActionsProps {
  editButtonRef: Ref<HTMLButtonElement>;
  /** The pencil, which opens the row, e.g. «Переименовать Акварель». */
  editLabel: string;
  isEditing: boolean;
  isSaving: boolean;
  onRemove: () => void;
  onStartEdit: () => void;
  /** E.g. «Удалить Акварель». */
  removeLabel: string;
}

/** The pencil of a row, while it is not being edited, and its removal. */
export function TitleRowActions({
  editButtonRef,
  editLabel,
  isEditing,
  isSaving,
  onRemove,
  onStartEdit,
  removeLabel,
}: TitleRowActionsProps) {
  return (
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
          // Keeps the click from moving the focus first, which would end the editing.
          onMouseDown={(event) => event.preventDefault()}
          onClick={onRemove}
        >
          <TrashIcon className={styles.actionIcon} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
