import type { SortingState, Updater } from "@tanstack/react-table";
import React from "react";
import { useSearchParams } from "react-router";

import { readTableView, type TableView, writeTableView } from "./tableView";

/**
 * The search and the sorting of a table, kept in the address (see `readTableView`), with the
 * handlers that change them. A change replaces the entry of the history: the back button leaves the
 * table instead of undoing each letter.
 */
export function useTableView(sortableColumns: readonly string[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Read once per address: the table recomputes its rows whenever its sorting is a new array.
  const view = React.useMemo(
    () => readTableView(searchParams, sortableColumns),
    [searchParams, sortableColumns],
  );

  function changeView(changes: Partial<TableView>) {
    setSearchParams(writeTableView(searchParams, { ...view, ...changes }), { replace: true });
  }

  function changeSorting(updater: Updater<SortingState>) {
    changeView({ sorting: typeof updater === "function" ? updater(view.sorting) : updater });
  }

  return { changeSorting, changeView, view };
}
