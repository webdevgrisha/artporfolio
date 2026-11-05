import { z } from "zod";

import type { Image } from "#shared/images/stored-image";
import { uploadIdSchema } from "#shared/images/uploads";

/** Pages of the public site that open with a main photo, the hero. */
export const pageIds = ["home", "gallery", "projects", "about", "contacts"] as const;

/** The path parameters of a request about one page. */
export const pageParamsSchema = z.object({
  page: z.enum(pageIds),
});

/** A new hero: the file uploaded before (see uploads.ts); a hero has no alt text. */
export const heroBodySchema = z.strictObject({
  uploadId: uploadIdSchema,
});

export type PageId = (typeof pageIds)[number];
export type PageParams = z.infer<typeof pageParamsSchema>;
export type HeroBody = z.infer<typeof heroBodySchema>;

/** A page as the API returns it. */
export interface Page {
  /** A background under the page title, so it has no alt text; null until one is uploaded. */
  hero: Image | null;
}

export interface PagesResponse {
  pages: Record<PageId, Page>;
}
