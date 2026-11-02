import type { GallerySection } from "@/entities/gallery";
import { gallerySectionPath } from "@/shared/config/routes";
import { EditIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton, IconButtonLink } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import { useIsDeletingSection } from "../model/useDeleteSection";
import styles from "./SectionsList.module.css";

interface SectionActionsProps {
  /** Asks to confirm the deletion. */
  onDelete: (section: GallerySection) => void;
  section: GallerySection;
}

/** The actions of a row of the list: open the section, or delete it. */
export function SectionActions({ onDelete, section }: SectionActionsProps) {
  const isDeleting = useIsDeletingSection(section.id);
  const editLabel = `Изменить ${section.title}`;
  const deleteLabel = `Удалить ${section.title}`;

  return (
    <div className={styles.actions}>
      <Tooltip content={editLabel}>
        <IconButtonLink label={editLabel} to={gallerySectionPath(section.id)}>
          <EditIcon className={styles.actionIcon} />
        </IconButtonLink>
      </Tooltip>
      <Tooltip content={deleteLabel}>
        <IconButton label={deleteLabel} disabled={isDeleting} onClick={() => onDelete(section)}>
          <TrashIcon className={styles.actionIcon} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
