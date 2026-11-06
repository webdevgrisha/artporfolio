import React from "react";

import type { GalleryCollectionSummary } from "@/entities/gallery";
import { routes } from "@/shared/config/routes";
import { useConfirmation } from "@/shared/lib/useConfirmation";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import { describeCollectionDeletion } from "../model/collectionDeletion";
import { collectionsSortableColumns, matchesCollectionQuery } from "../model/collectionsTableView";
import { useDeleteCollection, useDeletingCollectionIds } from "../model/useDeleteCollection";
import styles from "./CollectionsList.module.css";
import { collectionsColumns } from "./collectionsColumns";

interface CollectionsListProps {
  className?: string;
  /** In the order the site shows them: the latest first. */
  collections: readonly GalleryCollectionSummary[];
}

/**
 * Every collection, in a table; a collection opens by the pencil and is deleted after a
 * confirmation.
 */
export function CollectionsList({ className, collections }: CollectionsListProps) {
  const { mutate: deleteCollection } = useDeleteCollection();
  const deletingIds = useDeletingCollectionIds();
  const confirmation = useConfirmation(deleteCollection);
  const { ask } = confirmation;
  const columns = React.useMemo(
    () => collectionsColumns({ deletingIds, onDelete: ask }),
    [ask, deletingIds],
  );

  return (
    <>
      <DataTable
        className={className}
        tableClassName={styles.table}
        caption="Коллекции"
        columns={columns}
        items={collections}
        getId={(collection) => collection.id}
        matches={matchesCollectionQuery}
        sortableColumns={collectionsSortableColumns}
        searchLabel="Поиск по названию"
        addLink={{ label: "Добавить коллекцию", to: routes.galleryCollectionNew }}
        emptyText="Коллекций пока нет"
      />
      <ConfirmDeleteDialog
        isOpen={confirmation.pending !== undefined}
        title={`Удалить коллекцию «${confirmation.pending?.title ?? ""}»?`}
        description={describeCollectionDeletion(confirmation.pending?.workIds.length ?? 0)}
        onCancel={confirmation.cancel}
        onConfirm={confirmation.confirm}
      />
    </>
  );
}
