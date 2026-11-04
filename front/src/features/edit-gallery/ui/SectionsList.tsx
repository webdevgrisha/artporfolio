import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import React from "react";

import type { GallerySection } from "@/entities/gallery";
import { routes } from "@/shared/config/routes";
import { useTableView } from "@/shared/lib/useTableView";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { SearchInput } from "@/shared/ui/search-input";
import { TableHead } from "@/shared/ui/table-head";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { matchesSectionQuery, sectionsSortableColumns } from "../model/sectionsTableView";
import { useDeleteSection } from "../model/useDeleteSection";
import { SectionActions } from "./SectionActions";
import styles from "./SectionsList.module.css";

interface SectionsListProps {
  className?: string;
  /** Sorted by title, as the site shows them. */
  sections: readonly GallerySection[];
}

/** What the deletion of the section takes from the site, its subsections included. */
function deletionDescription({ subsections }: GallerySection): string {
  const count = subsections.length;

  if (count === 0) return "Раздел пропадёт с сайта. Это нельзя отменить.";

  const plural = new Intl.PluralRules("ru").select(count);
  const noun = plural === "one" ? "подраздел" : plural === "few" ? "подраздела" : "подразделов";

  return `Раздел и ${String(count)} ${noun} пропадут с сайта. Это нельзя отменить.`;
}

/** A section with its place on the site, which the sorting of the table does not change. */
interface SectionRow {
  position: number;
  section: GallerySection;
}

/**
 * Every section with its subsections; until it is sorted, by title as on the site, which «№» keeps
 * showing after a sort and while searching. The search, in the titles of the sections and their
 * subsections, and the sorting are kept in the address; a new section is added from beside the
 * search. A section opens for editing by the pencil and is deleted after a confirmation.
 */
export function SectionsList({ className, sections }: SectionsListProps) {
  const { changeSorting, changeView, view } = useTableView(sectionsSortableColumns);
  const { query } = view;
  const deletion = useDeleteSection();
  const [deleted, setDeleted] = React.useState<GallerySection>();
  const shownRows = React.useMemo(
    () =>
      sections
        .map((section, index) => ({ position: index + 1, section }))
        .filter(({ section }) => matchesSectionQuery(section, query)),
    [sections, query],
  );

  const columns = React.useMemo<ColumnDef<SectionRow>[]>(
    () => [
      {
        id: "position",
        header: "№",
        meta: { className: styles.positionColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => <span className={styles.muted}>{original.position}</span>,
      },
      {
        id: "title",
        header: "Раздел",
        meta: { className: styles.titleColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => original.section.title,
      },
      {
        id: "subsections",
        header: "Подразделы",
        accessorFn: (row) => row.section.subsections.length,
        // The most subsections first: the useful start.
        sortDescFirst: true,
        cell: ({ row: { original } }) =>
          original.section.subsections.length > 0 ? (
            original.section.subsections.map((subsection) => subsection.title).join(", ")
          ) : (
            <span className={styles.muted}>Нет</span>
          ),
      },
      {
        id: "actions",
        header: () => <VisuallyHidden>Действия</VisuallyHidden>,
        meta: { className: styles.actionsColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => (
          <SectionActions section={original.section} onDelete={setDeleted} />
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
    getRowId: (row) => row.section.id,
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
          label="Поиск по разделам и подразделам"
          clearLabel="Очистить поиск"
          value={query}
          summary={
            query ? `Найдено: ${String(shownRows.length)} из ${String(sections.length)}` : ""
          }
          onChange={changeQuery}
        />
        <ButtonLink to={routes.gallerySectionNew}>Добавить раздел</ButtonLink>
      </div>

      {sections.length === 0 ? (
        <p className={styles.empty}>Разделов пока нет</p>
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
              <VisuallyHidden>Разделы галереи</VisuallyHidden>
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
        title={`Удалить раздел «${deleted?.title ?? ""}»?`}
        description={deleted ? deletionDescription(deleted) : ""}
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
