import { http } from "@/shared/api/http";

import { type GalleryWorkSummary, galleryWorksResponseSchema } from "../../model/galleryWork";

/** Every work by its summary, in the order the site shows them. */
export async function getGalleryWorks(): Promise<GalleryWorkSummary[]> {
  const { works } = await http.get({ path: "/gallery/works", schema: galleryWorksResponseSchema });

  return works;
}
