import type { GalleryWork, WorkSize } from "@/entities/gallery";
import { toPhotoFormValues } from "@/shared/lib/photoForm";
import { toPhotoListRows } from "@/shared/lib/photoListForm";

import { toIdSet } from "../../model/idSet";
import { formatSide } from "./workDisplay";
import type { WorkFormValues } from "./workFormSchema";
import { parseSide } from "./workSide";

/** The values of a new work: every field empty. */
export const emptyWorkFormValues: WorkFormValues = {
  description: "",
  height: "",
  month: "",
  title: "",
  width: "",
  year: "",
  country: "",
  city: "",
  ...toPhotoFormValues(null),
  photos: [],
  sectionIds: [],
  materialIds: [],
  colorIds: [],
  paletteIds: [],
  // A new work is made to be shown.
  published: true,
  collectionId: "",
  format: "single",
  partCount: "",
  saleStatus: "available",
  price: "",
  discountPercent: "",
};

/** The values of a work as stored on the server. */
export function toWorkFormValues({
  city,
  collectionId,
  colorIds,
  country,
  description,
  format,
  materialIds,
  month,
  paletteIds,
  partCount,
  photo,
  price,
  processPhotos,
  published,
  saleStatus,
  sectionIds,
  size,
  title,
  year,
}: GalleryWork): WorkFormValues {
  return {
    description,
    height: formatSide(size.height),
    month: String(month),
    title,
    width: formatSide(size.width),
    year: String(year),
    country: country ?? "",
    city,
    ...toPhotoFormValues(photo),
    photos: toPhotoListRows(processPhotos),
    sectionIds: toIdSet(sectionIds),
    materialIds: toIdSet(materialIds),
    colorIds: toIdSet(colorIds),
    paletteIds: toIdSet(paletteIds),
    published,
    collectionId: collectionId ?? "",
    format,
    partCount: partCount === null ? "" : String(partCount),
    saleStatus,
    price: price === null ? "" : String(price.amount),
    discountPercent:
      price === null || price.discountPercent === null ? "" : String(price.discountPercent),
  };
}

/** The count of works of a set the form holds, once it has been checked; null for another format. */
export function toPartCount({ format, partCount }: WorkFormValues): number | null {
  return format === "set" ? Number(partCount.trim()) : null;
}

/** The size the form holds, once it has been checked. */
export function toWorkSize({ height, width }: WorkFormValues): WorkSize {
  return { height: parseSide(height), width: parseSide(width) };
}
