import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import React from "react";

import type { GalleryCollection } from "@/entities/gallery";
import { routes } from "@/shared/config/routes";
import { useTableView } from "@/shared/lib/useTableView";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { SearchInput } from "@/shared/ui/search-input";
import { TableHead } from "@/shared/ui/table-head";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";
import {
  collectionsSortableColumns,
  compareCollectionYears,
  matchesCollectionQuery,
} from "../model/collectionsTableView";
import { formatCollectionYears } from "../model/collectionYears";
import { useDeleteCollection } from "../model/useDeleteCollection";
import { CollectionActions } from "./CollectionActions";
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

/** A collection with its place on the site, which the sorting of the table does not change. */
interface CollectionRow {
  collection: GalleryCollection;
  position: number;
}

const collator = new Intl.Collator("ru", { sensitivity: "base" });

/**
 * Every collection; until it is sorted, in the order of the site, which «№» keeps showing after a
 * sort and while searching. The search, in the titles, and the sorting are kept in the address; a
 * new collection is added from beside the search. A collection opens for editing by the pencil and
 * is deleted after a confirmation.
 */
export function CollectionsList({ className, collections }: CollectionsListProps) {
  const { changeSorting, changeView, view } = useTableView(collectionsSortableColumns);
  const { query } = view;
  const deletion = useDeleteCollection();
  const [deleted, setDeleted] = React.useState<GalleryCollection>();
  const shownRows = React.useMemo(
    () =>
      collections
        .map((collection, index) => ({ collection, position: index + 1 }))
        .filter(({ collection }) => matchesCollectionQuery(collection, query)),
    [collections, query],
  );

  const columns = React.useMemo<ColumnDef<CollectionRow>[]>(
    () => [
      {
        id: "position",
        header: "№",
        meta: { className: styles.positionColumn },
        accessorFn: (row) => row.position,
        cell: ({ row: { original } }) => <span className={styles.muted}>{original.position}</span>,
      },
      {
        id: "cover",
        header: "Обложка",
        meta: { className: styles.coverColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => (
          <MediaImage
            className={styles.cover}
            source={imageToMediaItem(original.collection.cover).source}
          />
        ),
      },
      {
        id: "title",
        header: "Название",
        accessorFn: (row) => row.collection.title,
        sortingFn: (a, b) =>
          collator.compare(a.original.collection.title, b.original.collection.title),
      },
      {
        id: "years",
        header: "Годы",
        meta: { className: styles.yearsColumn },
        accessorFn: (row) => row.collection.startYear,
        sortingFn: (a, b) => compareCollectionYears(a.original.collection, b.original.collection),
        // The latest first, as the site shows them.
        sortDescFirst: true,
        cell: ({ row: { original } }) => formatCollectionYears(original.collection),
      },
      {
        id: "works",
        header: "Работ",
        meta: { className: styles.countColumn },
        accessorFn: (row) => row.collection.workIds.length,
        // The largest first: the useful start.
        sortDescFirst: true,
      },
      {
        id: "actions",
        header: () => <VisuallyHidden>Действия</VisuallyHidden>,
        meta: { className: styles.actionsColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => (
          <CollectionActions collection={original.collection} onDelete={setDeleted} />
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    // There are no pages, so nothing to reset when the rows change; the reset would render again.
    autoResetPageIndex: false,
    data: shownRows,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.collection.id,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: changeSorting,
    state: { sorting: view.sorting },
  });

  function changeQuery(next: string) {
    changeView({ query: next });
  }

  return (
    <div className={clsx(styles.root, className)}>
      <div className={styles.toolbar}>
        <SearchInput
          className={styles.search}
          label="Поиск по названию"
          clearLabel="Очистить поиск"
          value={query}
          summary={
            query ? `Найдено: ${String(shownRows.length)} из ${String(collections.length)}` : ""
          }
          onChange={changeQuery}
        />
        <ButtonLink to={routes.galleryCollectionNew}>Добавить коллекцию</ButtonLink>
      </div>

      {collections.length === 0 ? (
        <p className={styles.empty}>Коллекций пока нет</p>
      ) : shownRows.length === 0 ? (
        <div className={styles.empty}>
          <p>Ничего не найдено по запросу «{query}»</p>
          <Button variant="text" onClick={() => changeQuery("")}>
            Сбросить поиск
          </Button>
        </div>
      ) : (
        <div className={styles.scroller}>
          <table className={styles.table}>
            <caption>
              <VisuallyHidden>Коллекции</VisuallyHidden>
            </caption>
            <TableHead table={table} />
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={styles.row}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
}
