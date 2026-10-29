import { z } from "zod";

import { imageSchema } from "#shared/images/storage";

/** Pages of the public site that open with a main photo, the hero. */
export const pageIds = ["home", "gallery", "projects", "about", "contacts"] as const;

const pageIdSchema = z.enum(pageIds).meta({ id: "PageId" });

/** The path parameters of a request about one page. */
export const pageParamsSchema = z.object({
  page: pageIdSchema,
});

/** A hero upload sends only the file: a text field is rejected. */
export const heroUploadBodySchema = z.object({}).strict();

/** A page as the API returns it. */
export const pageSchema = z
  .object({
    hero: imageSchema.nullable().meta({
      description:
        "Background under the page title, so it has no alt text. `null` until a hero is uploaded.",
    }),
  })
  .meta({ id: "Page" });

export const pagesResponseSchema = z.object({ pages: z.record(pageIdSchema, pageSchema) });

export const heroResponseSchema = z.object({ hero: imageSchema });

export type PageId = z.infer<typeof pageIdSchema>;
export type PageParams = z.infer<typeof pageParamsSchema>;
export type Page = z.infer<typeof pageSchema>;
export type PagesResponse = z.infer<typeof pagesResponseSchema>;
export type HeroResponse = z.infer<typeof heroResponseSchema>;
