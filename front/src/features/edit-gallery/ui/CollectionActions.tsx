import type { GalleryCollection } from "@/entities/gallery";
import { galleryCollectionPath } from "@/shared/config/routes";
import { EditIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton, IconButtonLink } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import { useIsDeletingCollection } from "../model/useDeleteCollection";
import styles from "./CollectionsList.module.css";

interface CollectionActionsProps {
  collection: GalleryCollection;
  /** Asks to confirm the deletion. */
  onDelete: (collection: GalleryCollection) => void;
}

/** The actions of a row of the list: open the collection, or delete it. */
export function CollectionActions({ collection, onDelete }: CollectionActionsProps) {
  const isDeleting = useIsDeletingCollection(collection.id);
  const editLabel = `Изменить ${collection.title}`;
  const deleteLabel = `Удалить ${collection.title}`;

  return (
    <div className={styles.actions}>
      <Tooltip content={editLabel}>
        <IconButtonLink label={editLabel} to={galleryCollectionPath(collection.id)}>
          <EditIcon className={styles.actionIcon} />
        </IconButtonLink>
      </Tooltip>
      <Tooltip content={deleteLabel}>
        <IconButton label={deleteLabel} disabled={isDeleting} onClick={() => onDelete(collection)}>
          <TrashIcon className={styles.actionIcon} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
