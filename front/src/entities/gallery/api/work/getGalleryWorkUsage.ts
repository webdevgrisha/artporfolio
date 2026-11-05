import { http } from "@/shared/api/http";

import { type GalleryWorkUsage, galleryWorkUsageSchema } from "../../model/galleryWorkUsage";

/** How many works name each section, material, color and palette. */
export function getGalleryWorkUsage(): Promise<GalleryWorkUsage> {
  return http.get({ path: "/gallery/works/usage", schema: galleryWorkUsageSchema });
}
