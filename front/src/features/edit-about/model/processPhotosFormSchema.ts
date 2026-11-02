import { z } from "zod";

import { maxProcessPhotos } from "@/entities/about";
import { photoListRowsSchema } from "@/shared/lib/photoListForm";

export const processPhotosFormSchema = z.object({
  /** In the order the site shows them. */
  photos: photoListRowsSchema(maxProcessPhotos),
});

export type ProcessPhotosFormValues = z.infer<typeof processPhotosFormSchema>;
