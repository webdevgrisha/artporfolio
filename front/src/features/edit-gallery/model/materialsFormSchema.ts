import { z } from "zod";

import { type GalleryMaterials, maxMaterials } from "@/entities/gallery";

// Mirrors the server rules in backend/src/modules/gallery-materials/schema.ts.
export const maxMaterialTitleLength = 50;

export const materialTitleSchema = z
  .string()
  .trim()
  .min(1, "Введите название")
  .max(maxMaterialTitleLength, `Не длиннее ${String(maxMaterialTitleLength)} символов`);

/** The visitor reads "Акварель" and "акварель" as the same material. */
export function materialTitleKey(title: string): string {
  return title.trim().toLocaleLowerCase("ru");
}

export const materialsFormSchema = z.object({
  materials: z
    .array(
      z.object({
        /** Picked by the form for a new material, so works can refer to it once it is saved. */
        id: z.string(),
        title: materialTitleSchema,
      }),
    )
    .max(maxMaterials, `Не больше ${String(maxMaterials)} материалов`)
    .superRefine((materials, context) => {
      const seen = new Set<string>();

      materials.forEach(({ title }, index) => {
        const key = materialTitleKey(title);

        if (key && seen.has(key)) {
          context.addIssue({
            code: "custom",
            message: "Такой материал уже есть",
            path: [index, "title"],
          });
        }

        seen.add(key);
      });
    }),
});

export type MaterialsFormValues = z.infer<typeof materialsFormSchema>;

/** The values of the materials as stored on the server. */
export function toMaterialsFormValues({ materials }: GalleryMaterials): MaterialsFormValues {
  return { materials: materials.map(({ id, title }) => ({ id, title })) };
}
