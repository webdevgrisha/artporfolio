import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import React from "react";

import { type Project, ProjectCover } from "@/entities/project";
import { routes } from "@/shared/config/routes";
import { useTableView } from "@/shared/lib/useTableView";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ExternalLinkIcon } from "@/shared/ui/icon";
import { SearchInput } from "@/shared/ui/search-input";
import { TableHead } from "@/shared/ui/table-head";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { linkHost, matchesQuery, sortableColumns } from "../model/projectsTableView";
import { useDeleteProject } from "../model/useDeleteProject";
import { ProjectActions } from "./ProjectActions";
import styles from "./ProjectsTable.module.css";

interface ProjectsTableProps {
  className?: string;
  /** In the order the site shows them. */
  projects: readonly Project[];
}

/** A project with its place on the site, which the sorting of the table does not change. */
interface ProjectRow {
  position: number;
  project: Project;
}

const collator = new Intl.Collator("ru", { sensitivity: "base" });

/**
 * Every project; until it is sorted, in the order the site shows them, which «№» keeps showing
 * after a sort. The search and the sorting are kept in the address. A project opens for editing
 * by the pencil and is deleted after a confirmation; its place on the site is changed in
 * «Порядок на сайте».
 */
export function ProjectsTable({ className, projects }: ProjectsTableProps) {
  const { changeSorting, changeView, view } = useTableView(sortableColumns);
  const deletion = useDeleteProject();
  const [deleted, setDeleted] = React.useState<Project>();
  const shownRows = React.useMemo(
    () =>
      projects
        .map((project, index) => ({ position: index + 1, project }))
        .filter(({ project }) => matchesQuery(project, view.query)),
    [projects, view.query],
  );

  const columns = React.useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        id: "position",
        header: "№",
        meta: { className: styles.positionColumn },
        accessorFn: (row) => row.position,
        cell: ({ row: { original } }) => <span className={styles.muted}>{original.position}</span>,
      },
      {
        id: "photos",
        header: "Фото",
        meta: { className: styles.photoColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => (
          <ProjectCover className={styles.cover} project={original.project} />
        ),
      },
      {
        id: "title",
        header: "Название",
        meta: { className: styles.titleColumn },
        accessorFn: (row) => row.project.title,
        sortingFn: (a, b) => collator.compare(a.original.project.title, b.original.project.title),
        cell: ({ row: { original } }) => original.project.title,
      },
      {
        id: "link",
        header: "Ссылка",
        meta: { className: styles.linkColumn },
        accessorFn: (row) => linkHost(row.project.link),
        sortingFn: (a, b) =>
          collator.compare(linkHost(a.original.project.link), linkHost(b.original.project.link)),
        cell: ({ row: { original } }) => {
          const { link } = original.project;

          return link ? (
            <Tooltip content={link}>
              <a className={styles.externalLink} href={link} target="_blank" rel="noreferrer">
                <span className={styles.externalHost}>{linkHost(link)}</span>
                <ExternalLinkIcon className={styles.externalIcon} />
                <VisuallyHidden>(откроется в новой вкладке)</VisuallyHidden>
              </a>
            </Tooltip>
          ) : (
            <span className={styles.muted}>Нет ссылки</span>
          );
        },
      },
      {
        id: "actions",
        header: () => <VisuallyHidden>Действия</VisuallyHidden>,
        meta: { className: styles.actionsColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => (
          <ProjectActions project={original.project} onDelete={setDeleted} />
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
    getRowId: (row) => row.project.id,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: changeSorting,
    state: { sorting: view.sorting },
  });

  return (
    <div className={clsx(styles.root, className)}>
      <div className={styles.toolbar}>
        <SearchInput
          className={styles.search}
          label="Поиск по названию и ссылке"
          clearLabel="Очистить поиск"
          value={view.query}
          summary={
            view.query ? `Найдено: ${String(shownRows.length)} из ${String(projects.length)}` : ""
          }
          onChange={(query) => changeView({ query })}
        />
        <ButtonLink to={routes.projectNew}>Добавить проект</ButtonLink>
      </div>

      {projects.length === 0 ? (
        <p className={styles.empty}>Проектов пока нет</p>
      ) : shownRows.length === 0 ? (
        <div className={styles.empty}>
          <p>Ничего не найдено по запросу «{view.query}»</p>
          <Button variant="text" onClick={() => changeView({ query: "" })}>
            Сбросить поиск
          </Button>
        </div>
      ) : (
        <div className={styles.scroller}>
          <table className={styles.table}>
            <caption>
              <VisuallyHidden>Все проекты</VisuallyHidden>
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
    </div>
  );
}
