import { http } from "@/shared/api/http";

import { sectionApiPath } from "./sectionApiPath";

/** Deletes the section with its subsections. */
export function deleteGallerySection(id: string): Promise<void> {
  return http.deleteResource({ path: sectionApiPath(id) });
}
