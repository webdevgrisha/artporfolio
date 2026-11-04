import { EditIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton, IconButtonLink } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./RowActions.module.css";

interface RowActionsProps {
  /** The page that edits the item. */
  editTo: string;
  /** The item is being deleted, so it is not deleted twice meanwhile. */
  isDeleting: boolean;
  /** Asks to confirm the deletion. */
  onDelete: () => void;
  /** Names the item in the labels of the actions, such as its title. */
  title: string;
}

/** The actions of a row of a table: open the item by the pencil, or delete it. */
export function RowActions({ editTo, isDeleting, onDelete, title }: RowActionsProps) {
  const editLabel = `Изменить ${title}`;
  const deleteLabel = `Удалить ${title}`;

  return (
    <div className={styles.root}>
      <Tooltip content={editLabel}>
        <IconButtonLink label={editLabel} to={editTo}>
          <EditIcon className={styles.icon} />
        </IconButtonLink>
      </Tooltip>
      <Tooltip content={deleteLabel}>
        <IconButton label={deleteLabel} disabled={isDeleting} onClick={onDelete}>
          <TrashIcon className={styles.icon} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
