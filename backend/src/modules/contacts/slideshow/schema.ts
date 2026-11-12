import { z } from "zod";

import {
  type ListPhoto,
  photoListBodySchema,
  storedListPhotoSchema,
} from "#shared/images/photo-list";

/** The most photos the artist may upload for the slideshow; raise it when the artist needs more. */
export const maxSlideshowPhotos = 10;

/**
 * What the slideshow of the contacts page shows: the photos uploaded for it, or the photos of the
 * published works of the gallery, so it follows the gallery without any work of its own.
 */
export const slideshowSources = ["uploaded", "gallery"] as const;

/** The whole slideshow, which replaces the saved one. */
export const slideshowBodySchema = z.strictObject({
  source: z.enum(slideshowSources),
  /**
   * The uploaded photos in the order the site shows them; a saved photo left out is deleted. They
   * are kept while the gallery is shown, so going back to them brings them back.
   */
  photos: photoListBodySchema(maxSlideshowPhotos),
});

/** The slideshow as stored in a field of the contacts document. */
export const storedSlideshowSchema = z.object({
  source: z.enum(slideshowSources),
  photos: z.array(storedListPhotoSchema),
});

export interface Slideshow {
  source: SlideshowSource;
  /** The uploaded photos in the order the site shows them, whatever the source. */
  photos: ListPhoto[];
}

export type SlideshowBody = z.infer<typeof slideshowBodySchema>;
export type SlideshowSource = (typeof slideshowSources)[number];
export type StoredSlideshow = z.infer<typeof storedSlideshowSchema>;
