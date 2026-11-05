import { z } from "zod";

import {
  type GalleryWork,
  maxWorkCityLength,
  maxWorkColors,
  maxWorkMaterials,
  maxWorkPalettes,
  maxWorkProcessPhotos,
  maxWorkSections,
  maxWorkSetSize,
  maxWorkSide,
  minWorkSetSize,
  type WorkFormat,
  type WorkSize,
  workFormats,
  workSaleStatuses,
} from "@/entities/gallery";
import { photoFieldsShape, refinePhoto, toPhotoFormValues } from "@/shared/lib/photoForm";
import { photoListRowsSchema, toPhotoListRows } from "@/shared/lib/photoListForm";

import { toIdSet } from "../../model/idSet";
import { yearSchema } from "../../model/yearField";
import { discountError, priceError } from "./workPrice";

// Mirror the server rules in backend/src/modules/gallery-works/schema.ts.
export const workMaxLengths = {
  description: 2_000,
  city: maxWorkCityLength,
  title: 100,
} as const;

/** A side as typed: digits with at most two decimals, after a point or a comma, such as «29,7». */
const sidePattern = /^\d+(?:[.,]\d{1,2})?$/;

/** The number a side field holds; the field has been checked against `sidePattern`. */
export function parseSide(text: string): number {
  return Number(text.trim().replace(",", "."));
}

/** The text of a side in a field, with the comma usual in Russian: «29,7». */
export function formatSide(side: number): string {
  return String(side).replace(".", ",");
}

// Each step runs only on what the previous one accepted, so a field shows one error at a time.
const sideSchema = z
  .string()
  .trim()
  .min(1, "Введите размер")
  .pipe(z.string().regex(sidePattern, "Введите число, например 29,7"))
  .pipe(
    z
      .string()
      .refine((text) => parseSide(text) > 0, "Размер больше нуля")
      .refine(
        (text) => parseSide(text) <= maxWorkSide,
        `Не больше ${maxWorkSide.toLocaleString("ru")}`,
      ),
  );

/** Whether the month has not come yet; read when the form is checked. */
function isFutureMonth(year: number, month: number): boolean {
  const now = new Date();

  return year === now.getFullYear() && month > now.getMonth() + 1;
}

/**
 * Rejects a month to come in this year. A year to come has its own error, and the month is checked
 * only once both fields hold a value.
 */
function refineMonth(
  { month, year }: { month: string; year: string },
  context: z.RefinementCtx,
): void {
  if (/^\d{4}$/.test(year.trim()) && month && isFutureMonth(Number(year), Number(month))) {
    context.addIssue({ code: "custom", message: "Этот месяц ещё не наступил", path: ["month"] });
  }
}

/** What is wrong with the count of works of a set as typed, or null when it is a valid count. */
function partCountError(text: string): string | null {
  if (text === "") {
    return "Введите количество";
  }

  if (!/^\d+$/.test(text)) {
    return "Введите целое число";
  }

  const count = Number(text);

  return count < minWorkSetSize || count > maxWorkSetSize
    ? `От ${String(minWorkSetSize)} до ${String(maxWorkSetSize)}`
    : null;
}

/**
 * Checks the count of works of a set, which only a set has: while another format is chosen, the
 * field is hidden and its text is kept but not checked.
 */
function refinePartCount(
  { format, partCount }: { format: WorkFormat; partCount: string },
  context: z.RefinementCtx,
): void {
  const message = format === "set" ? partCountError(partCount.trim()) : null;

  if (message !== null) {
    context.addIssue({ code: "custom", message, path: ["partCount"] });
  }
}

/** Checks the price and the discount, which may both be empty: a work may have no price. */
function refinePrice(
  { discountPercent, price }: { discountPercent: string; price: string },
  context: z.RefinementCtx,
): void {
  const priceMessage = priceError(price);
  const discountMessage = discountError(discountPercent, price);

  if (priceMessage !== null) {
    context.addIssue({ code: "custom", message: priceMessage, path: ["price"] });
  }

  if (discountMessage !== null) {
    context.addIssue({ code: "custom", message: discountMessage, path: ["discountPercent"] });
  }
}

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

/** The formats to choose from, a single work first, as it is the usual one. */
export const workFormatOptions: readonly { label: string; value: WorkFormat }[] = [
  { label: "Одна работа", value: "single" },
  { label: "Диптих", value: "diptych" },
  { label: "Триптих", value: "triptych" },
  { label: "Несколько работ", value: "set" },
];

/** The format as the admin reads it in the table: «Одна работа», «Диптих», «12 шт.». */
export function formatWorkFormat({
  format,
  partCount,
}: {
  format: WorkFormat;
  partCount: number | null;
}): string {
  switch (format) {
    case "single":
      return "Одна работа";
    case "diptych":
      return "Диптих";
    case "triptych":
      return "Триптих";
    case "set":
      return `${String(partCount)} шт.`;
  }
}

/** The size the form holds, once it has been checked. */
export function toWorkSize({ height, width }: WorkFormValues): WorkSize {
  return { height: parseSide(height), width: parseSide(width) };
}

/** The size as the admin reads it: «29,7 × 42 см», the width first. */
export function formatWorkSize({ height, width }: WorkSize): string {
  return `${formatSide(width)} × ${formatSide(height)} см`;
}

const monthNames = new Intl.DateTimeFormat("ru", { month: "long" });

/** The name of the month on its own, as in a list: «март» for 3. */
function monthName(month: number): string {
  return monthNames.format(new Date(2000, month - 1, 1));
}

/** The months to choose from, «Январь» to «Декабрь». */
export const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const name = monthName(index + 1);

  return { label: name.charAt(0).toUpperCase() + name.slice(1), value: String(index + 1) };
});

/** When the work was finished, as the admin reads it: «март 2024». */
export function formatWorkDate({ month, year }: { month: number; year: number }): string {
  return `${monthName(month)} ${String(year)}`;
}
