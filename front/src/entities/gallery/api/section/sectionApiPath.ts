/** The address of one section in the API. */
export function sectionApiPath(id: string): string {
  return `/gallery/sections/${encodeURIComponent(id)}`;
}
