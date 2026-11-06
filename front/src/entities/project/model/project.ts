import { z } from "zod";

import { listPhotoSchema } from "@/shared/api/photo";
import { translationsSchema } from "@/shared/api/translations";

/** The most photos one project may have (backend/src/modules/projects/schema.ts). */
export const maxProjectPhotos = 20;

/** A project of the «Проекты» page. An empty description or link is not shown on the site. */
export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  link: z.string(),
  /** In the order the site shows them. */
  photos: z.array(listPhotoSchema),
  /** The title and the description in the other languages. */
  translations: translationsSchema,
  /** When the project was created, ISO 8601. */
  createdAt: z.iso.datetime(),
  /** When the admin last saved the project, ISO 8601; moving it does not count. */
  updatedAt: z.iso.datetime(),
});

export type Project = z.infer<typeof projectSchema>;

/** A project in the list: everything but its translations, which only its own page loads. */
export const projectSummarySchema = projectSchema.omit({ translations: true });

export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const projectsResponseSchema = z.object({
  /** In the order the site shows them. */
  projects: z.array(projectSummarySchema),
});

/** The ids of every project, in the order the site shows them. */
export const projectsOrderSchema = z.object({
  ids: z.array(z.string()),
});
