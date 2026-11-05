import { http, type Tagged } from "@/shared/api/http";

import { type GalleryWork, galleryWorkSchema } from "../../model/galleryWork";
import { workApiPath } from "./workApiPath";

/** The work with its ETag, which a change of it sends back. */
export function getGalleryWork(id: string): Promise<Tagged<GalleryWork>> {
  return http.getWithETag({ path: workApiPath(id), schema: galleryWorkSchema });
}
