import { z } from "zod";

import { listPhotoSchema } from "@/shared/api/photo";

/** The most photos the artist may upload for the slideshow (backend/src/modules/contacts/slideshow/schema.ts). */
export const maxSlideshowPhotos = 10;

/**
 * The slideshow of the contacts page: what it shows (the photos uploaded for it, or the landscape
 * photos of the published works) and the uploaded photos, which stay while the gallery is shown.
 */
export const slideshowSchema = z.object({
  source: z.enum(["uploaded", "gallery"]),
  /** In the order the site shows them. */
  photos: z.array(listPhotoSchema),
});

export type Slideshow = z.infer<typeof slideshowSchema>;
export type SlideshowSource = Slideshow["source"];
