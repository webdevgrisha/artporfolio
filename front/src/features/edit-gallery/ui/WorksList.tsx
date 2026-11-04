import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import React from "react";

import type { GalleryMaterial, GallerySection, GalleryWork } from "@/entities/gallery";
import { routes } from "@/shared/config/routes";
import { useTableView } from "@/shared/lib/useTableView";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { SearchInput } from "@/shared/ui/search-input";
import { TableHead } from "@/shared/ui/table-head";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { useDeleteWork } from "../model/useDeleteWork";
import { formatWorkDate, formatWorkSize } from "../model/workFormSchema";
import { titlesOf } from "../model/workReferences";
import { sectionLabels } from "../model/workSections";
import {
  compareWorkDates,
  compareWorkSizes,
  matchesWorkQuery,
  worksSortableColumns,
} from "../model/worksTableView";
import { WorkActions } from "./WorkActions";
import styles from "./WorksList.module.css";

interface WorksListProps {
  className?: string;
  /** In the order the site shows them: the latest first. */
  works: readonly GalleryWork[];
  /** The sections of the gallery, to name the sections of each work. */
  sections: readonly GallerySection[];
  /** The materials of the gallery, to name the materials of each work. */
  materials: readonly GalleryMaterial[];
}

/** A work with its place on the site, which the sorting of the table does not change. */
interface WorkRow {
  position: number;
  work: GalleryWork;
}

const collator = new Intl.Collator("ru", { sensitivity: "base" });

/**
 * Every work; until it is sorted, in the order of the site, which «№» keeps showing after a sort
 * and while searching. The search, in the titles, and the sorting are kept in the address; a new
 * work is added from beside the search. A work opens for editing by the pencil and is deleted after
 * a confirmation.
 */
export function WorksList({ className, materials, sections, works }: WorksListProps) {
  const { changeSorting, changeView, view } = useTableView(worksSortableColumns);
  const { query } = view;
  const deletion = useDeleteWork();
  const [deleted, setDeleted] = React.useState<GalleryWork>();
  const shownRows = React.useMemo(
    () =>
      works
        .map((work, index) => ({ position: index + 1, work }))
        .filter(({ work }) => matchesWorkQuery(work, query)),
    [works, query],
  );

  const columns = React.useMemo<ColumnDef<WorkRow>[]>(
    () => [
      {
        id: "position",
        header: "№",
        meta: { className: styles.positionColumn },
        accessorFn: (row) => row.position,
        cell: ({ row: { original } }) => <span className={styles.muted}>{original.position}</span>,
      },
      {
        id: "photo",
        header: "Фото",
        meta: { className: styles.photoColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => (
          <MediaImage
            className={styles.photo}
            source={imageToMediaItem(original.work.photo).source}
          />
        ),
      },
      {
        id: "title",
        header: "Название",
        accessorFn: (row) => row.work.title,
        sortingFn: (a, b) => collator.compare(a.original.work.title, b.original.work.title),
      },
      {
        id: "sections",
        header: "Разделы",
        enableSorting: false,
        cell: ({ row: { original } }) =>
          sectionLabels(original.work.sectionIds, sections).join(", "),
      },
      {
        id: "materials",
        header: "Материалы",
        enableSorting: false,
        cell: ({ row: { original } }) => titlesOf(original.work.materialIds, materials).join(", "),
      },
      {
        id: "size",
        header: "Размер",
        meta: { className: styles.sizeColumn },
        accessorFn: (row) => row.work.size,
        sortingFn: (a, b) => compareWorkSizes(a.original.work, b.original.work),
        // The smallest first would read as a step back; the largest first is the useful start.
        sortDescFirst: true,
        cell: ({ row: { original } }) => formatWorkSize(original.work.size),
      },
      {
        id: "date",
        header: "Дата",
        meta: { className: styles.dateColumn },
        accessorFn: (row) => row.work.year,
        sortingFn: (a, b) => compareWorkDates(a.original.work, b.original.work),
        // The latest first, as the site shows them.
        sortDescFirst: true,
        cell: ({ row: { original } }) => formatWorkDate(original.work),
      },
      {
        id: "actions",
        header: () => <VisuallyHidden>Действия</VisuallyHidden>,
        meta: { className: styles.actionsColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => <WorkActions work={original.work} onDelete={setDeleted} />,
      },
    ],
    [materials, sections],
  );

  const table = useReactTable({
    columns,
    // There are no pages, so nothing to reset when the rows change; the reset would render again.
    autoResetPageIndex: false,
    data: shownRows,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.work.id,
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
          summary={query ? `Найдено: ${String(shownRows.length)} из ${String(works.length)}` : ""}
          onChange={changeQuery}
        />
        <ButtonLink to={routes.galleryWorkNew}>Добавить работу</ButtonLink>
      </div>

      {works.length === 0 ? (
        <p className={styles.empty}>Работ пока нет</p>
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
              <VisuallyHidden>Все работы</VisuallyHidden>
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
        title={`Удалить работу «${deleted?.title ?? ""}»?`}
        description="Работа и все её фото пропадут с сайта. Это нельзя отменить."
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
