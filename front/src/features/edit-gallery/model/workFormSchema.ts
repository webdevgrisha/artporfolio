import { z } from "zod";

import { type GalleryWork, maxWorkSide, minWorkYear, type WorkSize } from "@/entities/gallery";
import { photoFieldsShape, refinePhoto, toPhotoFormValues } from "@/shared/lib/photoForm";

// Mirror the server rules in backend/src/modules/gallery-works/schema.ts.
export const workMaxLengths = {
  description: 2_000,
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

const yearSchema = z
  .string()
  .trim()
  .min(1, "Введите год")
  .pipe(z.string().regex(/^\d{4}$/, "Введите год четырьмя цифрами"))
  .pipe(
    z
      .string()
      .refine((text) => Number(text) >= minWorkYear, `Не раньше ${String(minWorkYear)}`)
      // Read when the form is checked, so a form left open over New Year takes the new year.
      .refine((text) => Number(text) <= new Date().getFullYear(), "Год ещё не наступил"),
  );

export const workFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Введите название")
      .max(workMaxLengths.title, `Не длиннее ${String(workMaxLengths.title)} символов`),
    /** An empty description is not shown on the site. */
    description: z
      .string()
      .trim()
      .max(workMaxLengths.description, `Не длиннее ${String(workMaxLengths.description)} символов`),
    width: sideSchema,
    height: sideSchema,
    year: yearSchema,
    ...photoFieldsShape,
  })
  // A work is shown by its photo, so it cannot be removed, only replaced.
  .superRefine(refinePhoto);

export type WorkFormValues = z.infer<typeof workFormSchema>;

/** The values of a new work: every field empty. */
export const emptyWorkFormValues: WorkFormValues = {
  description: "",
  height: "",
  title: "",
  width: "",
  year: "",
  ...toPhotoFormValues(null),
};

/** The values of a work as stored on the server. */
export function toWorkFormValues({
  description,
  photo,
  size,
  title,
  year,
}: GalleryWork): WorkFormValues {
  return {
    description,
    height: formatSide(size.height),
    title,
    width: formatSide(size.width),
    year: String(year),
    ...toPhotoFormValues(photo),
  };
}

/** The size the form holds, once it has been checked. */
export function toWorkSize({ height, width }: WorkFormValues): WorkSize {
  return { height: parseSide(height), width: parseSide(width) };
}

/** The size as the admin reads it: «29,7 × 42 см», the width first. */
export function formatWorkSize({ height, width }: WorkSize): string {
  return `${formatSide(width)} × ${formatSide(height)} см`;
}
