import React from "react";

import type { Project } from "@/entities/project";
import { routes } from "@/shared/config/routes";
import { useConfirmation } from "@/shared/lib/useConfirmation";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import { matchesQuery, sortableColumns } from "../model/projectsTableView";
import { useDeleteProject, useDeletingProjectIds } from "../model/useDeleteProject";
import styles from "./ProjectsTable.module.css";
import { projectsColumns } from "./projectsColumns";

interface ProjectsTableProps {
  className?: string;
  /** In the order the site shows them. */
  projects: readonly Project[];
}

/**
 * Every project, in a table; a project opens by the pencil and is deleted after a confirmation.
 * Its place on the site is changed in «Порядок на сайте».
 */
export function ProjectsTable({ className, projects }: ProjectsTableProps) {
  const { mutate: deleteProject } = useDeleteProject();
  const deletingIds = useDeletingProjectIds();
  const confirmation = useConfirmation(deleteProject);
  const { ask } = confirmation;
  const columns = React.useMemo(
    () => projectsColumns({ deletingIds, onDelete: ask }),
    [ask, deletingIds],
  );

  return (
    <>
      <DataTable
        className={className}
        tableClassName={styles.table}
        caption="Все проекты"
        columns={columns}
        items={projects}
        getId={(project) => project.id}
        matches={matchesQuery}
        sortableColumns={sortableColumns}
        searchLabel="Поиск по названию и ссылке"
        addLink={{ label: "Добавить проект", to: routes.projectNew }}
        emptyText="Проектов пока нет"
      />
      <ConfirmDeleteDialog
        isOpen={confirmation.pending !== undefined}
        title={`Удалить проект «${confirmation.pending?.title ?? ""}»?`}
        description="Проект и все его фото пропадут с сайта. Это нельзя отменить."
        onCancel={confirmation.cancel}
        onConfirm={confirmation.confirm}
      />
    </>
  );
}
