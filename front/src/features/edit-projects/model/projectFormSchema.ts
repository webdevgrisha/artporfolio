import { z } from "zod";

import { maxProjectPhotos, type Project } from "@/entities/project";
import { photoListRowsSchema, toPhotoListRows } from "@/shared/lib/photoListForm";
import { toTranslationValues, translationValuesSchema } from "@/shared/lib/translationsForm";
import type { TranslatedField } from "@/shared/ui/language-form";

// Mirror the server rules in backend/src/modules/projects/schema.ts.
export const projectMaxLengths = {
  description: 2_000,
  link: 2_048,
  title: 100,
} as const;

/** The texts of a project that are translated, under the names the server gives them. */
const projectTranslatedFields = ["title", "description"] as const;

/** How the project form shows its translated texts. */
export const projectLanguageFields: readonly TranslatedField[] = [
  { field: "title", label: "Название", source: "title" },
  { field: "description", label: "Описание", multiline: true, source: "description" },
];

export const projectFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Введите название")
    .max(projectMaxLengths.title, `Не длиннее ${String(projectMaxLengths.title)} символов`),
  description: z
    .string()
    .trim()
    .min(1, "Введите описание")
    .max(
      projectMaxLengths.description,
      `Не длиннее ${String(projectMaxLengths.description)} символов`,
    ),
  /** An empty link is not shown on the site. */
  link: z
    .string()
    .trim()
    .max(projectMaxLengths.link, `Не длиннее ${String(projectMaxLengths.link)} символов`)
    .pipe(z.union([z.literal(""), z.httpUrl("Введите ссылку вида https://…")])),
  /** In the order the site shows them; the site opens a project into its photos. */
  photos: photoListRowsSchema(maxProjectPhotos).min(1, "Добавьте хотя бы одно фото"),
  /** The texts in the other languages; an empty one is translated anew on save. */
  translations: translationValuesSchema({
    description: projectMaxLengths.description,
    title: projectMaxLengths.title,
  }),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

/** The values of a new project: every field empty, no photos. */
export const emptyProjectFormValues: ProjectFormValues = {
  description: "",
  link: "",
  photos: [],
  title: "",
  translations: toTranslationValues({}, projectTranslatedFields),
};

/** The values of a project as stored on the server. */
export function toProjectFormValues({
  description,
  link,
  photos,
  title,
  translations,
}: Project): ProjectFormValues {
  return {
    description,
    link,
    photos: toPhotoListRows(photos),
    title,
    translations: toTranslationValues(translations, projectTranslatedFields),
  };
}
