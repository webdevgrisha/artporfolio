import type { SortingState } from "@tanstack/react-table";

import type { Project } from "@/entities/project";

/** The columns the table sorts by, as named in the address. */
export const sortableColumns = ["title", "link"] as const;

type SortableColumn = (typeof sortableColumns)[number];

/** How the table is shown: kept in the address, so going back to it brings the same view. */
export interface ProjectsTableView {
  /** Searched in the title and the link; empty shows every project. */
  query: string;
  /** One column at most; empty keeps the order of the site. */
  sorting: SortingState;
}

const queryParam = "q";
const sortParam = "sort";

function isSortableColumn(value: string): value is SortableColumn {
  return (sortableColumns as readonly string[]).includes(value);
}

/** The view in `?q=слон&sort=title.asc`; anything else in the address is ignored. */
export function readTableView(params: URLSearchParams): ProjectsTableView {
  const [column = "", direction] = (params.get(sortParam) ?? "").split(".");
  const sorting =
    isSortableColumn(column) && (direction === "asc" || direction === "desc")
      ? [{ desc: direction === "desc", id: column }]
      : [];

  return { query: params.get(queryParam) ?? "", sorting };
}

/** The address of the view; the other parameters of `params` stay. */
export function writeTableView(
  params: URLSearchParams,
  { query, sorting }: ProjectsTableView,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const [sort] = sorting;

  if (query) next.set(queryParam, query);
  else next.delete(queryParam);

  if (sort) next.set(sortParam, `${sort.id}.${sort.desc ? "desc" : "asc"}`);
  else next.delete(sortParam);

  return next;
}

/** The host of a link, which is all the table has room for: «elephant.com». */
export function linkHost(link: string): string {
  try {
    return new URL(link).host.replace(/^www\./, "");
  } catch {
    return link;
  }
}

/** Whether the project's title or link contains the query, in any case. */
export function matchesQuery({ link, title }: Project, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase("ru");

  return (
    title.toLocaleLowerCase("ru").includes(needle) || link.toLocaleLowerCase("ru").includes(needle)
  );
}
