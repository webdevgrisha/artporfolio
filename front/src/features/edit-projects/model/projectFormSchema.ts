import { z } from "zod";

import { maxProjectPhotos, type Project } from "@/entities/project";
import { photoListRowsSchema, toPhotoListRows } from "@/shared/lib/photoListForm";

// Mirror the server rules in backend/src/modules/projects/schema.ts.
export const projectMaxLengths = {
  description: 2_000,
  link: 2_048,
  title: 100,
} as const;

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
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

/** The values of a new project: every field empty, no photos. */
export const emptyProjectFormValues: ProjectFormValues = {
  description: "",
  link: "",
  photos: [],
  title: "",
};

/** The values of a project as stored on the server. */
export function toProjectFormValues({
  description,
  link,
  photos,
  title,
}: Project): ProjectFormValues {
  return { description, link, photos: toPhotoListRows(photos), title };
}
