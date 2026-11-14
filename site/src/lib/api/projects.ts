import { z } from "zod";

import { photoSchema } from "@/lib/api/image";

/** A project of the artist, with its texts in the language of the page. */
const projectSchema = z.object({
  /** Its anchor in a link to it, the same in every language; it never changes. */
  slug: z.string(),
  title: z.string(),
  /** Plain text; paragraphs are separated by a blank line. */
  description: z.string(),
  /** The site of the project, or "" for none. */
  link: z.union([z.literal(""), z.url()]),
  /** In order; the admin asks for at least one, the page shows none without failing. */
  photos: z.array(photoSchema),
});

/** The projects as `GET /api/projects` returns them, in the order the site shows them. */
export const projectsSchema = z.object({
  projects: z.array(projectSchema),
});

/** The text above the list, as `GET /api/projects/intro` returns it; "" until the artist writes one. */
export const projectsIntroSchema = z.object({
  text: z.string(),
});
