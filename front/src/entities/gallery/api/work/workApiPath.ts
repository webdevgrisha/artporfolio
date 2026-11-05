/** The address of one work in the API. */
export function workApiPath(id: string): string {
  return `/gallery/works/${encodeURIComponent(id)}`;
}
