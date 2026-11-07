import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import React from "react";

import type { TableFilter } from "@/shared/lib/tableView";
import { useTableSearch } from "@/shared/lib/useTableSearch";
import { useTableView } from "@/shared/lib/useTableView";
import { Button, ButtonLink } from "@/shared/ui/button";
import { SearchInput } from "@/shared/ui/search-input";
import { Select } from "@/shared/ui/select";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import styles from "./DataTable.module.css";
import { TableHead } from "./TableHead";
import { TablePagination } from "./TablePagination";
import columnStyles from "./tableColumns.module.css";
import type { TableRow } from "./tableRow";

interface DataTableProps<TItem> {
  /** The link to the page that adds an item, beside the search. */
  addLink: { label: string; to: string };
  /** Names the table for screen readers, such as «Все работы». */
  caption: string;
  className?: string;
  columns: ColumnDef<TableRow<TItem>>[];
  /** Shown instead of the table while there are no items, such as «Работ пока нет». */
  emptyText: string;
  /** The lists under the search that narrow the rows; a new array reads the address again. */
  filters?: readonly TableFilter<TItem>[];
  getId: (item: TItem) => string;
  /** In the order of the site, which the table keeps until it is sorted. */
  items: readonly TItem[];
  /** Whether an item is found by the query of the search. */
  matches: (item: TItem, query: string) => boolean;
  /** The accessible name of the search, such as «Поиск по названию». */
  searchLabel: string;
  /** The ids of the columns that sort, as named in the address. */
  sortableColumns: readonly string[];
  /** Sets the widths of the table, such as its minimum before it scrolls. */
  tableClassName?: string;
}

/** The choice of a filter that shows every row. */
const everyItemOption = { label: "Все", value: "" };

const noFilters: readonly never[] = [];

/** So a long list stays quick to draw; a shorter one has no pages at all. */
const pageSize = 50;

/**
 * A list of the admin as a table: the search, the filters and the adding over it, the names of the
 * columns that sort it, a line per item and the pages under it. All of them but the adding are kept
 * in the address.
 */
export function DataTable<TItem>({
  addLink,
  caption,
  className,
  columns,
  emptyText,
  filters = noFilters,
  getId,
  items,
  matches,
  searchLabel,
  sortableColumns,
  tableClassName,
}: DataTableProps<TItem>) {
  const { changePage, changeSorting, changeView, view } = useTableView(sortableColumns, filters);
  const { changeQuery, forgetTyped, query } = useTableSearch(view.query, (next) =>
    changeView({ query: next }),
  );
  // The field follows every key at once; the rows follow when there is time for them.
  const searchedQuery = React.useDeferredValue(query);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const isFiltered = filters.some(({ id }) => view.filters[id]);
  const [areFiltersOpen, setAreFiltersOpen] = React.useState(isFiltered);
  const filtersId = React.useId();
  const rows = React.useMemo(
    () =>
      items
        .map((item, index) => ({ item, position: index + 1 }))
        .filter(
          ({ item }) =>
            matches(item, searchedQuery) &&
            filters.every(({ id, matches: fits }) => {
              const value = view.filters[id];

              return !value || fits(item, value);
            }),
        ),
    [filters, items, matches, searchedQuery, view.filters],
  );
  const pageCount = Math.ceil(rows.length / pageSize);
  // A search still on its way to the address already shows other rows, from their first page.
  const pageIndex = query === view.query ? Math.min(view.page, Math.max(pageCount, 1)) - 1 : 0;
  const table = useReactTable({
    columns,
    // The page comes from the address, which a change of the rows updates by itself.
    autoResetPageIndex: false,
    data: rows,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => getId(row.item),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: changeSorting,
    state: { pagination: { pageIndex, pageSize }, sorting: view.sorting },
  });

  function changeFilter(id: string, value: string) {
    changeView({ filters: { ...view.filters, [id]: value } });
  }

  function clearFilters(changes?: { query: string }) {
    if (changes) forgetTyped();
    changeView({ ...changes, filters: Object.fromEntries(filters.map(({ id }) => [id, ""])) });
  }

  function openPage(page: number) {
    changePage(page);
    rootRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <div ref={rootRef} className={clsx(styles.root, className)}>
      <div className={styles.toolbar}>
        <SearchInput
          className={styles.search}
          label={searchLabel}
          clearLabel="Очистить поиск"
          value={query}
          summary={
            query || isFiltered ? `Найдено: ${String(rows.length)} из ${String(items.length)}` : ""
          }
          onChange={changeQuery}
        />
        {filters.length > 0 ? (
          <Button
            className={styles.filtersToggle}
            variant="text"
            aria-controls={filtersId}
            aria-expanded={areFiltersOpen}
            onClick={() => setAreFiltersOpen(!areFiltersOpen)}
          >
            Фильтры
          </Button>
        ) : null}
        {/* Here and not by the filters: its line never moves the table once a filter is chosen. */}
        {isFiltered ? <Button onClick={() => clearFilters()}>Сбросить фильтры</Button> : null}
        <ButtonLink to={addLink.to}>{addLink.label}</ButtonLink>
      </div>

      {filters.length > 0 ? (
        <div
          id={filtersId}
          className={clsx(styles.filters, !areFiltersOpen && styles.filtersClosed)}
        >
          {filters.map(({ id, label, options }) => (
            <Select
              key={id}
              className={styles.filter}
              label={label}
              options={[everyItemOption, ...options]}
              value={view.filters[id] ?? ""}
              onChange={(value) => changeFilter(id, value)}
            />
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>
          <p>{query ? `Ничего не найдено по запросу «${query}»` : "Ничего не найдено"}</p>
          <Button onClick={() => clearFilters({ query: "" })}>
            {isFiltered ? "Сбросить поиск и фильтры" : "Сбросить поиск"}
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.scroller}>
            <table className={clsx(styles.table, tableClassName)}>
              <caption>
                <VisuallyHidden>{caption}</VisuallyHidden>
              </caption>
              <TableHead table={table} />
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className={styles.row}>
                    {row.getVisibleCells().map((cell) => {
                      const { meta } = cell.column.columnDef;

                      return (
                        <td
                          key={cell.id}
                          className={clsx(
                            meta?.className,
                            meta?.hiddenOnPhone && columnStyles.hiddenOnPhone,
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 ? (
            <TablePagination page={pageIndex + 1} pageCount={pageCount} onChange={openPage} />
          ) : null}
        </>
      )}
    </div>
  );
}
