import type { SortingState } from "@tanstack/react-table";

/** How a table is shown: kept in the address, so going back to it brings the same view. */
export interface TableView {
  /** Narrows the rows; empty shows every row. */
  query: string;
  /** One column at most; empty keeps the order the rows come in. */
  sorting: SortingState;
}

const queryParam = "q";
const sortParam = "sort";

/**
 * The view in `?q=слон&sort=title.asc`, sorted only by one of `sortableColumns`; anything else in
 * the address is ignored.
 */
export function readTableView(
  params: URLSearchParams,
  sortableColumns: readonly string[],
): TableView {
  const [column = "", direction] = (params.get(sortParam) ?? "").split(".");
  const sorting =
    sortableColumns.includes(column) && (direction === "asc" || direction === "desc")
      ? [{ desc: direction === "desc", id: column }]
      : [];

  return { query: params.get(queryParam) ?? "", sorting };
}

/** The address of the view; the other parameters of `params` stay. */
export function writeTableView(
  params: URLSearchParams,
  { query, sorting }: TableView,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const [sort] = sorting;

  if (query) next.set(queryParam, query);
  else next.delete(queryParam);

  if (sort) next.set(sortParam, `${sort.id}.${sort.desc ? "desc" : "asc"}`);
  else next.delete(sortParam);

  return next;
}
