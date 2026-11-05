import type { SortingState, Updater } from "@tanstack/react-table";
import React from "react";
import { useSearchParams } from "react-router";

import { readTableView, type TableFilter, type TableView, writeTableView } from "./tableView";

/**
 * The search, the filters and the sorting of a table, kept in the address (see `readTableView`), with the
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

  function changeView(changes: Partial<TableView>) {
    setSearchParams(writeTableView(searchParams, { ...view, ...changes }), { replace: true });
  }

  function changeSorting(updater: Updater<SortingState>) {
    changeView({ sorting: typeof updater === "function" ? updater(view.sorting) : updater });
  }

  return { changeSorting, changeView, view };
}
