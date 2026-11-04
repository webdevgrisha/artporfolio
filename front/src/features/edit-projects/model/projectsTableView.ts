import type { Project } from "@/entities/project";

/** The columns the table sorts by, as named in the address. */
export const sortableColumns = ["position", "title", "link"] as const;

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
