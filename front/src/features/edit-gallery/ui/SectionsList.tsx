import type { ColumnDef } from "@tanstack/react-table";
import React from "react";

import type { GallerySection } from "@/entities/gallery";
import { gallerySectionPath, routes } from "@/shared/config/routes";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  actionsColumn,
  DataTable,
  positionColumn,
  RowActions,
  type TableRow,
} from "@/shared/ui/data-table";

import { matchesSectionQuery, sectionsSortableColumns } from "../model/sectionsTableView";
import { useDeleteSection, useDeletingSectionIds } from "../model/useDeleteSection";
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

/**
 * Every section with its subsections, in a table, by title as on the site: «№» and the title
 * would only repeat that order, so only the count of subsections sorts. The search finds the
 * titles of the subsections too. A section opens by the pencil and is deleted after a
 * confirmation.
 */
export function SectionsList({ className, sections }: SectionsListProps) {
  const deletion = useDeleteSection();
  const deletingIds = useDeletingSectionIds();
  const [deleted, setDeleted] = React.useState<GallerySection>();

  const columns = React.useMemo<ColumnDef<TableRow<GallerySection>>[]>(
    () => [
      positionColumn({ isSortable: false }),
      {
        id: "title",
        header: "Раздел",
        meta: { className: styles.titleColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => original.item.title,
      },
      {
        id: "subsections",
        header: "Подразделы",
        accessorFn: (row) => row.item.subsections.length,
        // The most subsections first: the useful start.
        sortDescFirst: true,
        cell: ({ row: { original } }) =>
          original.item.subsections.length > 0 ? (
            original.item.subsections.map((subsection) => subsection.title).join(", ")
          ) : (
            <span className={styles.none}>Нет</span>
          ),
      },
      actionsColumn((section) => (
        <RowActions
          title={section.title}
          editTo={gallerySectionPath(section.id)}
          isDeleting={deletingIds.includes(section.id)}
          onDelete={() => setDeleted(section)}
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
        caption="Разделы галереи"
        columns={columns}
        items={sections}
        getId={(section) => section.id}
        matches={matchesSectionQuery}
        sortableColumns={sectionsSortableColumns}
        searchLabel="Поиск по разделам и подразделам"
        addLink={{ label: "Добавить раздел", to: routes.gallerySectionNew }}
        emptyText="Разделов пока нет"
      />
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
    </>
  );
}
