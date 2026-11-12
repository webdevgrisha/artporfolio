import { z } from "zod";

import { maxSlideshowPhotos } from "@/entities/contacts";
import { photoListRowsSchema } from "@/shared/lib/photoListForm";

export const slideshowFormSchema = z.object({
  /** Shows the photos of the gallery in place of the uploaded ones, which are kept. */
  fromGallery: z.boolean(),
  /** In the order the site shows them. */
  photos: photoListRowsSchema(maxSlideshowPhotos),
});

export type SlideshowFormValues = z.infer<typeof slideshowFormSchema>;
