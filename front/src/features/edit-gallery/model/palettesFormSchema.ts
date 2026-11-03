import { z } from "zod";

import { type GalleryPalettes, maxPalettes } from "@/entities/gallery";

import { refineUniqueTitles, titleSchema } from "./titles";

export const palettesFormSchema = z.object({
  palettes: z
    .array(
      z.object({
        /** Picked by the form for a new palette, so works can refer to it once it is saved. */
        id: z.string(),
        title: titleSchema,
      }),
    )
    .max(maxPalettes, `Не больше ${String(maxPalettes)} палитр`)
    .superRefine(refineUniqueTitles("Такая палитра уже есть")),
});

export type PalettesFormValues = z.infer<typeof palettesFormSchema>;

/** The values of the palettes as stored on the server. */
export function toPalettesFormValues({ palettes }: GalleryPalettes): PalettesFormValues {
  return { palettes: palettes.map(({ id, title }) => ({ id, title })) };
}
