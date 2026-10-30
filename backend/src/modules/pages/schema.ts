import { z } from "zod";

import { imageSchema } from "#shared/images/storage";
import { uploadIdSchema } from "#shared/images/uploads";

/** A page as the API returns it. */
export const pageSchema = z.object({
  /** A background under the page title, so it has no alt text; null until one is uploaded. */
  hero: imageSchema.nullable(),
});

/** Pages of the public site that open with a main photo, the hero. */
const pagesSchema = z.object({
  home: pageSchema,
  gallery: pageSchema,
  projects: pageSchema,
  about: pageSchema,
  contacts: pageSchema,
});

const pageIdSchema = pagesSchema.keyof();

export const pageIds = pageIdSchema.options;

/** The path parameters of a request about one page. */
export const pageParamsSchema = z.object({
  page: pageIdSchema,
});

/** A new hero: the file uploaded before (see uploads.ts); a hero has no alt text. */
export const heroBodySchema = z.strictObject({
  uploadId: uploadIdSchema,
});

export const pagesResponseSchema = z.object({ pages: pagesSchema });

export const heroResponseSchema = z.object({ hero: imageSchema });

export type PageId = z.infer<typeof pageIdSchema>;
export type PageParams = z.infer<typeof pageParamsSchema>;
export type HeroBody = z.infer<typeof heroBodySchema>;
export type Page = z.infer<typeof pageSchema>;
export type PagesResponse = z.infer<typeof pagesResponseSchema>;
export type HeroResponse = z.infer<typeof heroResponseSchema>;
