import type { SortingState } from "@tanstack/react-table";

/** A choice that narrows the rows of a table, such as the section of a work. */
export interface TableFilter<TItem> {
  /** The name of the filter in the address. */
  id: string;
  /** The name of the filter over its list, such as «Раздел». */
  label: string;
  /** Whether an item fits the chosen value. */
  matches: (item: TItem, value: string) => boolean;
  /** What to choose from, besides every item. */
  options: readonly { label: string; value: string }[];
}

/** How a table is shown: kept in the address, so going back to it brings the same view. */
export interface TableView {
  /** The chosen value by the id of its filter; empty shows every row. */
  filters: Readonly<Record<string, string>>;
  /** From 1. */
  page: number;
  /** Narrows the rows; empty shows every row. */
  query: string;
  /** One column at most; empty keeps the order the rows come in. */
  sorting: SortingState;
}

const pageParam = "page";
const queryParam = "q";
const sortParam = "sort";

/**
 * The view in `?q=слон&sort=title.asc&page=2&section=…`, sorted only by one of `sortableColumns` and
 * narrowed only by the options of `filters`; anything else in the address is ignored, such as a
 * section deleted since the link was saved.
 */
export function readTableView<TItem>(
  params: URLSearchParams,
  sortableColumns: readonly string[],
  filters: readonly TableFilter<TItem>[] = [],
): TableView {
  const [column = "", direction] = (params.get(sortParam) ?? "").split(".");
  const sorting =
    sortableColumns.includes(column) && (direction === "asc" || direction === "desc")
      ? [{ desc: direction === "desc", id: column }]
      : [];

  const chosen = filters.map(({ id, options }) => {
    const value = params.get(id);

    return [id, options.some((option) => option.value === value) ? value : ""];
  });

  const page = Number(params.get(pageParam));

  return {
    filters: Object.fromEntries(chosen),
    page: Number.isInteger(page) && page > 1 ? page : 1,
    query: params.get(queryParam) ?? "",
    sorting,
  };
}

/** The address of the view; the other parameters of `params` stay. */
export function writeTableView(
  params: URLSearchParams,
  { filters, page, query, sorting }: TableView,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const [sort] = sorting;

  if (query) next.set(queryParam, query);
  else next.delete(queryParam);

  if (page > 1) next.set(pageParam, String(page));
  else next.delete(pageParam);

  if (sort) next.set(sortParam, `${sort.id}.${sort.desc ? "desc" : "asc"}`);
  else next.delete(sortParam);

  for (const [id, value] of Object.entries(filters)) {
    if (value) next.set(id, value);
    else next.delete(id);
  }

  return next;
}
