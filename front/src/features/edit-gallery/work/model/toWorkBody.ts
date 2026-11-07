import type { GalleryWorkBody } from "@/entities/gallery";
import { toPhotoBody } from "@/shared/lib/photoForm";
import { toPhotoListItems } from "@/shared/lib/photoListForm";
import type { WorkFormValues } from "./workFormSchema";
import { toPartCount, toWorkSize } from "./workFormValues";
import { toWorkPrice } from "./workPriceInput";

/** Uploads the newly picked files, then gives the work as the server takes it. */
export async function toWorkBody(values: WorkFormValues): Promise<GalleryWorkBody> {
  const {
    collectionId,
    colorIds,
    description,
    materialIds,
    month,
    paletteIds,
    photos,
    sectionIds,
    title,
    year,
  } = values;

  return {
    description,
    photo: await toPhotoBody(values),
    processPhotos: await toPhotoListItems(photos),
    sectionIds,
    materialIds,
    colorIds,
    paletteIds,
    published: values.published,
    collectionId: collectionId === "" ? null : collectionId,
    format: values.format,
    partCount: toPartCount(values),
    saleStatus: values.saleStatus,
    price: toWorkPrice(values),
    size: toWorkSize(values),
    title,
    year: Number(year),
    month: Number(month),
    country: values.country === "" ? null : values.country,
    city: values.city,
  };
}
