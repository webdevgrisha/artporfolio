import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortDirection,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import React from "react";
import { Link, useSearchParams } from "react-router";

import type { Project } from "@/entities/project";
import { projectPath, routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { SearchInput } from "@/shared/ui/search-input";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { linkHost, matchesQuery, readTableView, writeTableView } from "../model/projectsTableView";
import { useDeleteProject } from "../model/useDeleteProject";
import styles from "./ProjectsTable.module.css";

interface ProjectsTableProps {
  className?: string;
  /** In the order the site shows them. */
  projects: readonly Project[];
}

const collator = new Intl.Collator("ru", { sensitivity: "base" });

const ariaSort = {
  asc: "ascending",
  desc: "descending",
} as const satisfies Record<SortDirection, string>;

/**
 * Every project; until it is sorted, in the order the site shows them. The search and the sorting
 * are kept in the address. A project opens for editing by its title and is deleted after a
 * confirmation; its place on the site is changed in «Порядок на сайте».
 */
export function ProjectsTable({ className, projects }: ProjectsTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Read once per address: the table recomputes its rows whenever its sorting is a new array.
  const view = React.useMemo(() => readTableView(searchParams), [searchParams]);
  const deletion = useDeleteProject();
  const [deleted, setDeleted] = React.useState<Project>();
  const shownProjects = React.useMemo(
    () => projects.filter((project) => matchesQuery(project, view.query)),
    [projects, view.query],
  );

  const columns = React.useMemo<ColumnDef<Project>[]>(
    () => [
      {
        id: "photos",
        header: "Фото",
        accessorFn: (project) => project.photos.length,
        cell: ({ row: { original: project } }) => {
          const [cover] = project.photos;

          return (
            <div className={styles.photos}>
              {cover ? (
                <MediaImage className={styles.cover} source={imageToMediaItem(cover).source} />
              ) : (
                <span className={styles.cover} />
              )}
              <span className={styles.muted}>{project.photos.length} фото</span>
            </div>
          );
        },
      },
      {
        id: "title",
        header: "Название",
        accessorFn: (project) => project.title,
        sortingFn: (a, b) => collator.compare(a.original.title, b.original.title),
        cell: ({ row: { original: project } }) => (
          <Link to={projectPath(project.id)}>{project.title}</Link>
        ),
      },
      {
        id: "link",
        header: "Ссылка",
        accessorFn: (project) => linkHost(project.link),
        sortingFn: (a, b) => collator.compare(linkHost(a.original.link), linkHost(b.original.link)),
        cell: ({ row: { original: project } }) =>
          project.link ? (
            <a href={project.link} target="_blank" rel="noreferrer">
              {linkHost(project.link)}
            </a>
          ) : (
            <span className={styles.muted}>Нет ссылки</span>
          ),
      },
      {
        id: "actions",
        header: () => <VisuallyHidden>Действия</VisuallyHidden>,
        enableSorting: false,
        cell: ({ row: { original: project } }) => {
          const deleteLabel = `Удалить ${project.title}`;

          return (
            <div className={styles.actions}>
              <Tooltip content={deleteLabel}>
                <IconButton label={deleteLabel} onClick={() => setDeleted(project)}>
                  <TrashIcon className={styles.removeIcon} />
                </IconButton>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [],
  );

  function changeView(changes: Partial<typeof view>) {
    // Replaces the entry: the back button leaves the table instead of undoing each letter.
    setSearchParams(writeTableView(searchParams, { ...view, ...changes }), { replace: true });
  }

  function changeSorting(updater: Updater<SortingState>) {
    changeView({ sorting: typeof updater === "function" ? updater(view.sorting) : updater });
  }

  const table = useReactTable({
    columns,
    // There are no pages, so nothing to reset when the rows change; the reset would render again.
    autoResetPageIndex: false,
    data: shownProjects,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (project) => project.id,
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
          onChange={(query) => changeView({ query })}
        />
        <ButtonLink to={routes.projectNew}>Добавить проект</ButtonLink>
      </div>

      {projects.length === 0 ? (
        <p className={styles.empty}>Проектов пока нет</p>
      ) : shownProjects.length === 0 ? (
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
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const label = flexRender(header.column.columnDef.header, header.getContext());

                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={
                          header.column.getCanSort()
                            ? sorted
                              ? ariaSort[sorted]
                              : "none"
                            : undefined
                        }
                      >
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            className={styles.sortButton}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {label}
                            {sorted === "asc" ? <ArrowUpIcon className={styles.sortIcon} /> : null}
                            {sorted === "desc" ? (
                              <ArrowDownIcon className={styles.sortIcon} />
                            ) : null}
                          </button>
                        ) : (
                          label
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={styles.row}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
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
