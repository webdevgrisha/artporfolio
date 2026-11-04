import type { ColumnDef } from "@tanstack/react-table";
import React from "react";

import type { GallerySection, GalleryWork } from "@/entities/gallery";
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
import { describeWorkUsage, type WorkUsage, workUsage } from "../model/workUsage";
import styles from "./SectionsList.module.css";

interface SectionsListProps {
  className?: string;
  /** Sorted by title, as the site shows them. */
  sections: readonly GallerySection[];
  /** Every work, to count the works in each section. */
  works: readonly GalleryWork[];
}

const noUsage: WorkUsage = { count: 0, onlyCount: 0 };

/** How the works use the section: a work in any of its subsections is in the section too. */
function sectionUsage(
  { id, subsections }: GallerySection,
  works: readonly GalleryWork[],
): WorkUsage {
  return workUsage(
    works.map((work) => work.sectionIds),
    new Set([id, ...subsections.map((subsection) => subsection.id)]),
  );
}

/**
 * What the deletion of the section takes from the site, its subsections included, and what it
 * leaves the works that were in it.
 */
function deletionDescription({ subsections }: GallerySection, usage: WorkUsage): string {
  const count = subsections.length;
  const plural = new Intl.PluralRules("ru").select(count);
  const noun = plural === "one" ? "подраздел" : plural === "few" ? "подраздела" : "подразделов";
  const removal =
    count === 0
      ? "Раздел пропадёт с сайта."
      : `Раздел и ${String(count)} ${noun} пропадут с сайта.`;
  const works =
    usage.count === 0 ? "" : ` ${describeWorkUsage(usage, { item: "раздел", others: "разделов" })}`;

  return `${removal}${works} Это нельзя отменить.`;
}

/**
 * Every section with its subsections, in a table, by title as on the site: «№» and the title
 * would only repeat that order, so only the counts of subsections and of works sort. The search finds the
 * titles of the subsections too. A section opens by the pencil and is deleted after a
 * confirmation.
 */
export function SectionsList({ className, sections, works }: SectionsListProps) {
  const deletion = useDeleteSection();
  const deletingIds = useDeletingSectionIds();
  const [deleted, setDeleted] = React.useState<GallerySection>();
  const usages = React.useMemo(
    () => new Map(sections.map((section) => [section.id, sectionUsage(section, works)])),
    [sections, works],
  );

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
      {
        id: "works",
        header: "Работ",
        meta: { className: styles.countColumn },
        accessorFn: (row) => (usages.get(row.item.id) ?? noUsage).count,
        // The largest first: the useful start.
        sortDescFirst: true,
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
    [deletingIds, usages],
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
        description={deleted ? deletionDescription(deleted, usages.get(deleted.id) ?? noUsage) : ""}
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
