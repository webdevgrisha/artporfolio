import { http } from "@/shared/api/http";

import { collectionApiPath } from "./collectionApiPath";

/**
 * Deletes the collection with its cover; its works stay, each on its own.
 */
export function deleteGalleryCollection(id: string): Promise<void> {
  return http.deleteResource({ path: collectionApiPath(id) });
}
