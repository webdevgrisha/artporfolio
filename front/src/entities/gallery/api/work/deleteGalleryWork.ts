import { http } from "@/shared/api/http";

import { workApiPath } from "./workApiPath";

/** Deletes the work with its photos. */
export function deleteGalleryWork(id: string): Promise<void> {
  return http.deleteResource({ path: workApiPath(id) });
}
