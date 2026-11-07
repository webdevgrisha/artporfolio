import React from "react";
import type { GallerySectionSummary, WorkUsages } from "@/entities/gallery";
import { routes } from "@/shared/config/routes";
import { useConfirmation } from "@/shared/lib/useConfirmation";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import { usageOf } from "../../model/workUsage";
import { describeSectionDeletion } from "../model/sectionDeletion";
import { matchesSectionQuery, sectionsSortableColumns } from "../model/sectionsTableView";
import { useDeleteSection, useDeletingSectionIds } from "../model/useDeleteSection";
import styles from "./SectionsList.module.css";
import { sectionsColumns } from "./sectionsColumns";

interface SectionsListProps {
  className?: string;
  /** Sorted by title, as the site shows them. */
  sections: readonly GallerySectionSummary[];
  /** How many works each section has, its subsections' included, by its id. */
  usages: WorkUsages;
}

/**
 * Every section with its subsections, in a table, by title as on the site: «№» and the title
 * would only repeat that order, so only the counts of subsections and of works sort. The search finds the
 * titles of the subsections too. A section opens by the pencil and is deleted after a
 * confirmation.
 */
export function SectionsList({ className, sections, usages }: SectionsListProps) {
  const { mutate: deleteSection } = useDeleteSection();
  const deletingIds = useDeletingSectionIds();
  const confirmation = useConfirmation(deleteSection);
  const { ask, pending } = confirmation;
  const columns = React.useMemo(
    () => sectionsColumns({ deletingIds, onDelete: ask, usages }),
    [ask, deletingIds, usages],
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
      <ConfirmDeleteDialog
        isOpen={pending !== undefined}
        title={`Удалить раздел «${pending?.title ?? ""}»?`}
        description={pending ? describeSectionDeletion(pending, usageOf(usages, pending.id)) : ""}
        onCancel={confirmation.cancel}
        onConfirm={confirmation.confirm}
      />
    </>
  );
}
