import { replaceSlideshow, type Slideshow } from "@/entities/contacts";
import type { Tagged } from "@/shared/api/http";
import { toPhotoListItems } from "@/shared/lib/photoListForm";

import type { SlideshowFormValues } from "./slideshowFormSchema";

export interface SaveSlideshowParams {
  /** The ETag of the slideshow the values were made from. */
  etag: string;
  values: SlideshowFormValues;
}

/**
 * Uploads the picked files, then replaces the slideshow in one request, which the server saves all
 * or nothing. Until that request, nothing on the site changes. Returns the saved slideshow.
 */
export async function saveSlideshow({
  etag,
  values,
}: SaveSlideshowParams): Promise<Tagged<Slideshow>> {
  return replaceSlideshow({
    etag,
    photos: await toPhotoListItems(values.photos),
    source: values.fromGallery ? "gallery" : "uploaded",
  });
}
