import { z } from "zod";

import { maxWorkSide } from "@/entities/gallery";

/** A side as typed: digits with at most two decimals, after a point or a comma, such as «29,7». */
const sidePattern = /^\d+(?:[.,]\d{1,2})?$/;

/** The number a side field holds; the field has been checked against `sidePattern`. */
export function parseSide(text: string): number {
  return Number(text.trim().replace(",", "."));
}

// Each step runs only on what the previous one accepted, so a field shows one error at a time.
export const sideSchema = z
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
