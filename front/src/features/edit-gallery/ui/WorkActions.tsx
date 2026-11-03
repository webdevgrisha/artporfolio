import type { GalleryWork } from "@/entities/gallery";
import { galleryWorkPath } from "@/shared/config/routes";
import { EditIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton, IconButtonLink } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import { useIsDeletingWork } from "../model/useDeleteWork";
import styles from "./WorksList.module.css";

interface WorkActionsProps {
  /** Asks to confirm the deletion. */
  onDelete: (work: GalleryWork) => void;
  work: GalleryWork;
}

/** The actions of a row of the list: open the work, or delete it. */
export function WorkActions({ onDelete, work }: WorkActionsProps) {
  const isDeleting = useIsDeletingWork(work.id);
  const editLabel = `Изменить ${work.title}`;
  const deleteLabel = `Удалить ${work.title}`;

  return (
    <div className={styles.actions}>
      <Tooltip content={editLabel}>
        <IconButtonLink label={editLabel} to={galleryWorkPath(work.id)}>
          <EditIcon className={styles.actionIcon} />
        </IconButtonLink>
      </Tooltip>
      <Tooltip content={deleteLabel}>
        <IconButton label={deleteLabel} disabled={isDeleting} onClick={() => onDelete(work)}>
          <TrashIcon className={styles.actionIcon} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
