import { z } from "zod";

import { imageSchema } from "@/shared/api/image";

/** The pages of the public site that open with a main photo. Mirrors backend/src/modules/pages/schema.ts. */
export const sitePageIds = ["home", "gallery", "projects", "about", "contacts"] as const;

export type SitePageId = (typeof sitePageIds)[number];

/** The main photo of a page as its `GET` returns it: `null` until one is uploaded. */
export const pageHeroResponseSchema = z.object({
  hero: imageSchema.nullable(),
});

/** The shape of every API response that returns a saved hero. */
export const heroResponseSchema = z.object({
  hero: imageSchema,
});
