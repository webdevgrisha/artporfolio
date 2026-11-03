import { z } from "zod";

import { type GalleryMaterials, maxMaterials } from "@/entities/gallery";

import { refineUniqueTitles, titleSchema } from "./titles";

export const materialsFormSchema = z.object({
  materials: z
    .array(
      z.object({
        /** Picked by the form for a new material, so works can refer to it once it is saved. */
        id: z.string(),
        title: titleSchema,
      }),
    )
    .max(maxMaterials, `Не больше ${String(maxMaterials)} материалов`)
    .superRefine(refineUniqueTitles("Такой материал уже есть")),
});

export type MaterialsFormValues = z.infer<typeof materialsFormSchema>;

/** The values of the materials as stored on the server. */
export function toMaterialsFormValues({ materials }: GalleryMaterials): MaterialsFormValues {
  return { materials: materials.map(({ id, title }) => ({ id, title })) };
}
