import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import React from "react";

import { useTableView } from "@/shared/lib/useTableView";
import { Button, ButtonLink } from "@/shared/ui/button";
import { SearchInput } from "@/shared/ui/search-input";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import styles from "./DataTable.module.css";
import { TableHead } from "./TableHead";
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

/**
 * A list of the admin as a table: the search and the adding over it, the names of the columns
 * that sort it, and a line per item. The search and the sorting are kept in the address.
 */
export function DataTable<TItem>({
  addLink,
  caption,
  className,
  columns,
  emptyText,
  getId,
  items,
  matches,
  searchLabel,
  sortableColumns,
  tableClassName,
}: DataTableProps<TItem>) {
  const { changeSorting, changeView, view } = useTableView(sortableColumns);
  const { query } = view;
  const rows = React.useMemo(
    () =>
      items
        .map((item, index) => ({ item, position: index + 1 }))
        .filter(({ item }) => matches(item, query)),
    [items, matches, query],
  );
  const table = useReactTable({
    columns,
    // There are no pages, so nothing to reset when the rows change; the reset would render again.
    autoResetPageIndex: false,
    data: rows,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => getId(row.item),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: changeSorting,
    state: { sorting: view.sorting },
  });

  function changeQuery(next: string) {
    changeView({ query: next });
  }

  return (
    <div className={clsx(styles.root, className)}>
      <div className={styles.toolbar}>
        <SearchInput
          className={styles.search}
          label={searchLabel}
          clearLabel="Очистить поиск"
          value={query}
          summary={query ? `Найдено: ${String(rows.length)} из ${String(items.length)}` : ""}
          onChange={changeQuery}
        />
        <ButtonLink to={addLink.to}>{addLink.label}</ButtonLink>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>
          <p>Ничего не найдено по запросу «{query}»</p>
          <Button variant="text" onClick={() => changeQuery("")}>
            Сбросить поиск
          </Button>
        </div>
      ) : (
        <div className={styles.scroller}>
          <table className={clsx(styles.table, tableClassName)}>
            <caption>
              <VisuallyHidden>{caption}</VisuallyHidden>
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
    </div>
  );
}
