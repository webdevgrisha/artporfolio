/** The address of one project in the API. */
export function projectApiPath(id: string): string {
  return `/projects/${encodeURIComponent(id)}`;
}
