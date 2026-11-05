import { z } from "zod";

import {
  maxWorkCityLength,
  maxWorkColors,
  maxWorkMaterials,
  maxWorkPalettes,
  maxWorkProcessPhotos,
  maxWorkSections,
  workFormats,
  workSaleStatuses,
} from "@/entities/gallery";
import { photoFieldsShape, refinePhoto } from "@/shared/lib/photoForm";
import { photoListRowsSchema } from "@/shared/lib/photoListForm";
import { yearSchema } from "../../model/yearField";
import { refineMonth, refinePartCount, refinePrice } from "./workFormRefinements";
import { sideSchema } from "./workSide";

// Mirror the server rules in backend/src/modules/gallery/works/schema.ts.
export const workMaxLengths = {
  description: 2_000,
  city: maxWorkCityLength,
  title: 100,
} as const;

export const workFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Введите название")
      .max(workMaxLengths.title, `Не длиннее ${String(workMaxLengths.title)} символов`),
    description: z
      .string()
      .trim()
      .min(1, "Введите описание")
      .max(workMaxLengths.description, `Не длиннее ${String(workMaxLengths.description)} символов`),
    width: sideSchema,
    height: sideSchema,
    /** The number of the month, «1» for January; empty until one is chosen. */
    month: z.string().min(1, "Выберите месяц"),
    year: yearSchema,
    /** The code of the country the work was made in; empty for none. */
    country: z.string(),
    /** The city the work was made in; may be empty. */
    city: z
      .string()
      .trim()
      .max(workMaxLengths.city, `Не длиннее ${String(workMaxLengths.city)} символов`),
    ...photoFieldsShape,
    /**
     * The process photos, in the order the site shows them. `PhotoListField` edits the list in the
     * `photos` field.
     */
    photos: photoListRowsSchema(maxWorkProcessPhotos),
    /** The sections and subsections, by id, in the order they were chosen. */
    sectionIds: z
      .array(z.string())
      .min(1, "Выберите хотя бы один раздел")
      .max(maxWorkSections, `Не больше ${String(maxWorkSections)} разделов`),
    /** The materials, by id, in the order they were chosen. */
    materialIds: z
      .array(z.string())
      .min(1, "Выберите хотя бы один материал")
      .max(maxWorkMaterials, `Не больше ${String(maxWorkMaterials)} материалов`),
    /** The colors, by id, in the order they were chosen. */
    colorIds: z
      .array(z.string())
      .min(1, "Выберите хотя бы один цвет")
      .max(maxWorkColors, `Не больше ${String(maxWorkColors)} цветов`),
    /** The palettes, by id, in the order they were chosen. */
    paletteIds: z
      .array(z.string())
      .min(1, "Выберите хотя бы одну палитру")
      .max(maxWorkPalettes, `Не больше ${String(maxWorkPalettes)} палитр`),
    /** Whether the site shows the work. */
    published: z.boolean(),
    /** The id of the collection; empty for a work on its own. */
    collectionId: z.string(),
    format: z.enum(workFormats),
    /** The count of works of a set, as typed; empty for a new work. */
    partCount: z.string(),
    saleStatus: z.enum(workSaleStatuses),
    /** The price in whole dollars, as typed; empty for a work without a price. */
    price: z.string(),
    /** The percent taken off the price, as typed; empty for none. */
    discountPercent: z.string(),
  })
  // A work is shown by its photo, so it cannot be removed, only replaced.
  .superRefine(refinePhoto)
  .superRefine(refineMonth)
  .superRefine(refinePartCount)
  .superRefine(refinePrice);

export type WorkFormValues = z.infer<typeof workFormSchema>;
