import { z } from "zod";

import { minWorkYear } from "@/entities/gallery";

/** A year as typed: four digits, from the earliest a work can be dated up to this year. */
export const yearSchema = z
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
