import type { GalleryCollectionBody } from "@/entities/gallery";
import { toPhotoBody } from "@/shared/lib/photoForm";
import type { CollectionFormValues } from "./collectionFormSchema";

/** Uploads a newly picked cover, then gives the collection as the server takes it. */
export async function toCollectionBody(
  values: CollectionFormValues,
): Promise<GalleryCollectionBody> {
  const { description, endYear, startYear, title, workIds } = values;

  return {
    cover: await toPhotoBody(values),
    description,
    endYear: endYear.trim() ? Number(endYear) : null,
    startYear: Number(startYear),
    title,
    workIds,
  };
}
