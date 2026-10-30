import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type RowData,
  type SortDirection,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import React from "react";
import { Link, useSearchParams } from "react-router";

import type { Project } from "@/entities/project";
import { projectPath } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EditIcon,
  ExternalLinkIcon,
  SortIcon,
  TrashIcon,
} from "@/shared/ui/icon";
import { IconButton, IconButtonLink } from "@/shared/ui/icon-button";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { SearchInput } from "@/shared/ui/search-input";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { linkHost, matchesQuery, readTableView, writeTableView } from "../model/projectsTableView";
import { useDeleteProject } from "../model/useDeleteProject";
import styles from "./ProjectsTable.module.css";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Fits the column to its content, so the rest of the width goes to the text columns. */
    isNarrow?: boolean;
  }
}

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

const ariaSort = {
  asc: "ascending",
  desc: "descending",
} as const satisfies Record<SortDirection, string>;

/** Which way a column is sorted: an arrow once it is, a pale double arrowhead until then. */
function SortState({ direction }: { direction: SortDirection | false }) {
  if (direction === "asc") return <ArrowUpIcon className={styles.sortArrow} />;
  if (direction === "desc") return <ArrowDownIcon className={styles.sortArrow} />;

  return <SortIcon className={styles.sortIdle} />;
}

/**
 * Every project; until it is sorted, in the order the site shows them, which «№» keeps showing
 * after a sort. The search and the sorting are kept in the address. A project opens for editing
 * by its cover, its title or the pencil and is deleted after a confirmation; its place on the site
 * is changed in «Порядок на сайте».
 */
export function ProjectsTable({ className, projects }: ProjectsTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Read once per address: the table recomputes its rows whenever its sorting is a new array.
  const view = React.useMemo(() => readTableView(searchParams), [searchParams]);
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
        meta: { isNarrow: true },
        accessorFn: (row) => row.position,
        cell: ({ row: { original } }) => <span className={styles.muted}>{original.position}</span>,
      },
      {
        id: "photos",
        header: "Фото",
        meta: { isNarrow: true },
        enableSorting: false,
        cell: ({ row: { original } }) => {
          const [cover] = original.project.photos;
          const image = cover ? (
            <MediaImage className={styles.cover} source={imageToMediaItem(cover).source} />
          ) : (
            <span className={styles.cover} />
          );

          // A larger target than the title; the title link names the project for assistive
          // technology, so this one is skipped by it and by the keyboard.
          return (
            <Link to={projectPath(original.project.id)} tabIndex={-1} aria-hidden="true">
              {image}
            </Link>
          );
        },
      },
      {
        id: "title",
        header: "Название",
        accessorFn: (row) => row.project.title,
        sortingFn: (a, b) => collator.compare(a.original.project.title, b.original.project.title),
        cell: ({ row: { original } }) => (
          <Link className={styles.textLink} to={projectPath(original.project.id)}>
            {original.project.title}
          </Link>
        ),
      },
      {
        id: "link",
        header: "Ссылка",
        accessorFn: (row) => linkHost(row.project.link),
        sortingFn: (a, b) =>
          collator.compare(linkHost(a.original.project.link), linkHost(b.original.project.link)),
        cell: ({ row: { original } }) => {
          const { link } = original.project;

          return link ? (
            <Tooltip content={link}>
              <a className={styles.externalLink} href={link} target="_blank" rel="noreferrer">
                {linkHost(link)}
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
        meta: { isNarrow: true },
        enableSorting: false,
        cell: ({ row: { original } }) => {
          const { project } = original;
          const editLabel = `Изменить ${project.title}`;
          const deleteLabel = `Удалить ${project.title}`;

          return (
            <div className={styles.actions}>
              <Tooltip content={editLabel}>
                <IconButtonLink label={editLabel} to={projectPath(project.id)}>
                  <EditIcon className={styles.editIcon} />
                </IconButtonLink>
              </Tooltip>
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
      <div className={styles.search}>
        <SearchInput
          label="Поиск по названию и ссылке"
          clearLabel="Очистить поиск"
          value={view.query}
          onChange={(query) => changeView({ query })}
        />
        <p className={styles.found} aria-live="polite">
          {view.query && shownRows.length > 0
            ? `Найдено: ${String(shownRows.length)} из ${String(projects.length)}`
            : ""}
        </p>
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
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    const label = flexRender(header.column.columnDef.header, header.getContext());

                    return (
                      <th
                        key={header.id}
                        className={clsx(header.column.columnDef.meta?.isNarrow && styles.narrow)}
                        scope="col"
                        aria-sort={canSort ? (sorted ? ariaSort[sorted] : "none") : undefined}
                      >
                        {canSort ? (
                          <button
                            type="button"
                            className={styles.sortButton}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {label}
                            <SortState direction={sorted} />
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
                    <td
                      key={cell.id}
                      className={clsx(cell.column.columnDef.meta?.isNarrow && styles.narrow)}
                    >
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
