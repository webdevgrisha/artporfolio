import type { ColumnDef } from "@tanstack/react-table";
import type { GallerySection, WorkUsages } from "@/entities/gallery";
import { gallerySectionPath } from "@/shared/config/routes";
import { actionsColumn, positionColumn, RowActions, type TableRow } from "@/shared/ui/data-table";
import { usageOf } from "../../model/workUsage";
import styles from "./SectionsList.module.css";

interface SectionsColumnsParams {
  /** The sections being deleted, by id. */
  deletingIds: readonly string[];
  onDelete: (section: GallerySection) => void;
  /** How many works each section has, its subsections' included, by its id. */
  usages: WorkUsages;
}

/** The columns of the table of sections. */
export function sectionsColumns({
  deletingIds,
  onDelete,
  usages,
}: SectionsColumnsParams): ColumnDef<TableRow<GallerySection>>[] {
  return [
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
      accessorFn: (row) => usageOf(usages, row.item.id).count,
      // The largest first: the useful start.
      sortDescFirst: true,
    },
    actionsColumn((section) => (
      <RowActions
        title={section.title}
        editTo={gallerySectionPath(section.id)}
        isDeleting={deletingIds.includes(section.id)}
        onDelete={() => onDelete(section)}
      />
    )),
  ];
}
