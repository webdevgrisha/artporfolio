import type { ColumnDef } from "@tanstack/react-table";
import React from "react";

import type { Project } from "@/entities/project";
import { projectPath, routes } from "@/shared/config/routes";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  actionsColumn,
  DataTable,
  positionColumn,
  RowActions,
  type TableRow,
} from "@/shared/ui/data-table";
import { ExternalLinkIcon } from "@/shared/ui/icon";
import { PhotoThumbnail } from "@/shared/ui/media-preview";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { linkHost, matchesQuery, sortableColumns } from "../model/projectsTableView";
import { useDeleteProject, useDeletingProjectIds } from "../model/useDeleteProject";
import styles from "./ProjectsTable.module.css";

interface ProjectsTableProps {
  className?: string;
  /** In the order the site shows them. */
  projects: readonly Project[];
}

const collator = new Intl.Collator("ru", { sensitivity: "base" });

/**
 * Every project, in a table; a project opens by the pencil and is deleted after a confirmation.
 * Its place on the site is changed in «Порядок на сайте».
 */
export function ProjectsTable({ className, projects }: ProjectsTableProps) {
  const deletion = useDeleteProject();
  const deletingIds = useDeletingProjectIds();
  const [deleted, setDeleted] = React.useState<Project>();

  const columns = React.useMemo<ColumnDef<TableRow<Project>>[]>(
    () => [
      positionColumn({ isSortable: true }),
      {
        id: "photos",
        header: "Фото",
        meta: { className: styles.photoColumn },
        enableSorting: false,
        // The first photo is the cover of the project.
        cell: ({ row: { original } }) => <PhotoThumbnail image={original.item.photos[0]} />,
      },
      {
        id: "title",
        header: "Название",
        accessorFn: (row) => row.item.title,
        sortingFn: (a, b) => collator.compare(a.original.item.title, b.original.item.title),
      },
      {
        id: "link",
        header: "Ссылка",
        meta: { className: styles.linkColumn },
        accessorFn: (row) => linkHost(row.item.link),
        sortingFn: (a, b) =>
          collator.compare(linkHost(a.original.item.link), linkHost(b.original.item.link)),
        cell: ({ row: { original } }) => {
          const { link } = original.item;

          return link ? (
            <Tooltip content={link}>
              <a className={styles.externalLink} href={link} target="_blank" rel="noreferrer">
                <span className={styles.externalHost}>{linkHost(link)}</span>
                <ExternalLinkIcon className={styles.externalIcon} />
                <VisuallyHidden>(откроется в новой вкладке)</VisuallyHidden>
              </a>
            </Tooltip>
          ) : (
            <span className={styles.none}>Нет ссылки</span>
          );
        },
      },
      actionsColumn((project) => (
        <RowActions
          title={project.title}
          editTo={projectPath(project.id)}
          isDeleting={deletingIds.includes(project.id)}
          onDelete={() => setDeleted(project)}
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
      <ConfirmDialog
        isOpen={deleted !== undefined}
        title={`Удалить проект «${deleted?.title ?? ""}»?`}
        description="Проект и все его фото пропадут с сайта. Это нельзя отменить."
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
