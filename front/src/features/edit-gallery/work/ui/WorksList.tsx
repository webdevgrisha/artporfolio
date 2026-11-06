import React from "react";

import type {
  GalleryCollectionSummary,
  GalleryMaterial,
  GallerySection,
  GalleryWorkSummary,
} from "@/entities/gallery";
import { routes } from "@/shared/config/routes";
import { useConfirmation } from "@/shared/lib/useConfirmation";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import { useDeleteWork, useDeletingWorkIds } from "../model/useDeleteWork";
import { createWorkFilters, matchesWorkQuery, worksSortableColumns } from "../model/worksTableView";
import styles from "./WorksList.module.css";
import { worksColumns } from "./worksColumns";

interface WorksListProps {
  className?: string;
  /** In the order the site shows them: the latest first. */
  works: readonly GalleryWorkSummary[];
  /** The sections of the gallery, to name the sections of each work. */
  sections: readonly GallerySection[];
  /** The materials of the gallery, to name the materials of each work. */
  materials: readonly GalleryMaterial[];
  /** The collections of the gallery, to name the collection of each work. */
  collections: readonly GalleryCollectionSummary[];
}

/** Every work, in a table; a work opens by the pencil and is deleted after a confirmation. */
export function WorksList({ className, collections, materials, sections, works }: WorksListProps) {
  const { mutate: deleteWork } = useDeleteWork();
  const deletingIds = useDeletingWorkIds();
  const confirmation = useConfirmation(deleteWork);
  const filters = React.useMemo(
    () => createWorkFilters(collections, materials, sections),
    [collections, materials, sections],
  );
  const { ask } = confirmation;
  const columns = React.useMemo(
    () => worksColumns({ collections, deletingIds, materials, onDelete: ask, sections }),
    [ask, collections, deletingIds, materials, sections],
  );

  return (
    <>
      <DataTable
        className={className}
        tableClassName={styles.table}
        caption="Все работы"
        columns={columns}
        filters={filters}
        items={works}
        getId={(work) => work.id}
        matches={matchesWorkQuery}
        sortableColumns={worksSortableColumns}
        searchLabel="Поиск по названию"
        addLink={{ label: "Добавить работу", to: routes.galleryWorkNew }}
        emptyText="Работ пока нет"
      />
      <ConfirmDeleteDialog
        isOpen={confirmation.pending !== undefined}
        title={`Удалить работу «${confirmation.pending?.title ?? ""}»?`}
        description="Работа и все её фото пропадут с сайта. Это нельзя отменить."
        onCancel={confirmation.cancel}
        onConfirm={confirmation.confirm}
      />
    </>
  );
}
