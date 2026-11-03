import { z } from "zod";

import { type GalleryColors, maxColors } from "@/entities/gallery";

import { refineUniqueTitles, titleSchema } from "./titles";

/** The swatch of a new color until another is picked: a neutral grey. */
export const defaultColorHex = "#808080";

export const colorsFormSchema = z.object({
  colors: z
    .array(
      z.object({
        /** Picked by the form for a new color, so works can refer to it once it is saved. */
        id: z.string(),
        title: titleSchema,
        // Mirrors the server rule in backend/src/modules/gallery-colors/schema.ts; the color picker
        // of the browser always gives such a value.
        hex: z.string().regex(/^#[0-9a-f]{6}$/i, "Выберите цвет"),
      }),
    )
    .max(maxColors, `Не больше ${String(maxColors)} цветов`)
    .superRefine(refineUniqueTitles("Такой цвет уже есть")),
});

export type ColorsFormValues = z.infer<typeof colorsFormSchema>;

/** The values of the colors as stored on the server. */
export function toColorsFormValues({ colors }: GalleryColors): ColorsFormValues {
  return { colors: colors.map(({ hex, id, title }) => ({ hex, id, title })) };
}
