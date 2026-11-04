import type { ColumnDef } from "@tanstack/react-table";
import React from "react";

import type { GalleryCollection } from "@/entities/gallery";
import { galleryCollectionPath, routes } from "@/shared/config/routes";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  actionsColumn,
  DataTable,
  positionColumn,
  RowActions,
  TablePhoto,
  type TableRow,
} from "@/shared/ui/data-table";

import {
  collectionsSortableColumns,
  compareCollectionYears,
  matchesCollectionQuery,
} from "../model/collectionsTableView";
import { formatCollectionYears } from "../model/collectionYears";
import { useDeleteCollection, useDeletingCollectionIds } from "../model/useDeleteCollection";
import styles from "./CollectionsList.module.css";

interface CollectionsListProps {
  className?: string;
  /** In the order the site shows them: the latest first. */
  collections: readonly GalleryCollection[];
}

/** What deleting the collection does to its works, which stay in the gallery. */
function deletionDescription(count: number): string {
  if (count === 0) return "Коллекция пропадёт с сайта. Это нельзя отменить.";

  const plural = new Intl.PluralRules("ru").select(count);
  const noun = plural === "one" ? "работа" : plural === "few" ? "работы" : "работ";
  const verb = plural === "one" ? "останется" : "останутся";

  return `Коллекция пропадёт с сайта, её ${String(count)} ${noun} ${verb} в галерее без коллекции. Это нельзя отменить.`;
}

const collator = new Intl.Collator("ru", { sensitivity: "base" });

/**
 * Every collection, in a table; a collection opens by the pencil and is deleted after a
 * confirmation.
 */
export function CollectionsList({ className, collections }: CollectionsListProps) {
  const deletion = useDeleteCollection();
  const deletingIds = useDeletingCollectionIds();
  const [deleted, setDeleted] = React.useState<GalleryCollection>();

  const columns = React.useMemo<ColumnDef<TableRow<GalleryCollection>>[]>(
    () => [
      positionColumn({ isSortable: true }),
      {
        id: "cover",
        header: "Обложка",
        meta: { className: styles.coverColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => <TablePhoto image={original.item.cover} />,
      },
      {
        id: "title",
        header: "Название",
        accessorFn: (row) => row.item.title,
        sortingFn: (a, b) => collator.compare(a.original.item.title, b.original.item.title),
      },
      {
        id: "years",
        header: "Годы",
        meta: { className: styles.yearsColumn },
        accessorFn: (row) => row.item.startYear,
        sortingFn: (a, b) => compareCollectionYears(a.original.item, b.original.item),
        // The latest first, as the site shows them.
        sortDescFirst: true,
        cell: ({ row: { original } }) => formatCollectionYears(original.item),
      },
      {
        id: "works",
        header: "Работ",
        meta: { className: styles.countColumn },
        accessorFn: (row) => row.item.workIds.length,
        // The largest first: the useful start.
        sortDescFirst: true,
      },
      actionsColumn((collection) => (
        <RowActions
          title={collection.title}
          editTo={galleryCollectionPath(collection.id)}
          isDeleting={deletingIds.includes(collection.id)}
          onDelete={() => setDeleted(collection)}
        />
      )),
    ],
    [deletingIds],
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
      <ConfirmDialog
        isOpen={deleted !== undefined}
        title={`Удалить коллекцию «${deleted?.title ?? ""}»?`}
        description={deletionDescription(deleted?.workIds.length ?? 0)}
        cancelLabel="Отмена"
        confirmLabel="Удалить"
        onCancel={() => setDeleted(undefined)}
        onConfirm={() => {
          if (deleted) deletion.mutate(deleted);
          setDeleted(undefined);
        }}
      />
    </>
  );
}
