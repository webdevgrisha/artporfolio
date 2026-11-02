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
import { useSearchParams } from "react-router";

import { type Project, ProjectCover } from "@/entities/project";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon, SortIcon } from "@/shared/ui/icon";
import { SearchInput } from "@/shared/ui/search-input";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { linkHost, matchesQuery, readTableView, writeTableView } from "../model/projectsTableView";
import { useDeleteProject } from "../model/useDeleteProject";
import { ProjectActions } from "./ProjectActions";
import styles from "./ProjectsTable.module.css";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** The class of the column's header and cells, such as its width. */
    className?: string;
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
 * by the pencil and is deleted after a confirmation; its place on the site is changed in
 * «Порядок на сайте».
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
      <SearchInput
        label="Поиск по названию и ссылке"
        clearLabel="Очистить поиск"
        value={view.query}
        summary={
          view.query ? `Найдено: ${String(shownRows.length)} из ${String(projects.length)}` : ""
        }
        onChange={(query) => changeView({ query })}
      />

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
                        className={header.column.columnDef.meta?.className}
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
