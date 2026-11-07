import type { SortingState, Updater } from "@tanstack/react-table";
import React from "react";
import { useSearchParams } from "react-router";

import { readTableView, type TableFilter, type TableView, writeTableView } from "./tableView";

/**
 * The search, the filters, the sorting and the page of a table, kept in the address (see `readTableView`), with the
 * handlers that change them. A change replaces the entry of the history: the back button leaves the
 * table instead of undoing each letter.
 */
export function useTableView<TItem>(
  sortableColumns: readonly string[],
  filters: readonly TableFilter<TItem>[],
) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Read once per address: the table recomputes its rows whenever its sorting is a new array.
  const view = React.useMemo(
    () => readTableView(searchParams, sortableColumns, filters),
    [filters, searchParams, sortableColumns],
  );

  function write(next: TableView) {
    setSearchParams(writeTableView(searchParams, next), { replace: true });
  }

  /** Other rows are shown, so the table starts from its first page. */
  function changeView(changes: Partial<Omit<TableView, "page">>) {
    write({ ...view, ...changes, page: 1 });
  }

  function changePage(page: number) {
    write({ ...view, page });
  }

  function changeSorting(updater: Updater<SortingState>) {
    changeView({ sorting: typeof updater === "function" ? updater(view.sorting) : updater });
  }

  return { changePage, changeSorting, changeView, view };
}
