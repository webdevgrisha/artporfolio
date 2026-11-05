/** The address of one collection in the API. */
export function collectionApiPath(id: string): string {
  return `/gallery/collections/${encodeURIComponent(id)}`;
}
