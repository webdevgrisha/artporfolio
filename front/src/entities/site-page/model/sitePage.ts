import { z } from "zod";

import { imageSchema } from "@/shared/api/image";

/** A page of the public site as the API returns it. */
const sitePageSchema = z.object({
  /** The main photo, shown behind the page title; `null` until one is uploaded. */
  hero: imageSchema.nullable(),
});

/** The pages that open with a main photo. Mirrors backend/src/modules/pages/schema.ts. */
export const sitePagesSchema = z.object({
  about: sitePageSchema,
  contacts: sitePageSchema,
  gallery: sitePageSchema,
  home: sitePageSchema,
  projects: sitePageSchema,
});

export const sitePageIds = sitePagesSchema.keyof().options;

export type SitePages = z.infer<typeof sitePagesSchema>;
export type SitePageId = keyof SitePages;
