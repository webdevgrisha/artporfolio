import { z } from "zod";

import type { Image } from "#shared/images/storage";

/** Pages of the public site that open with a main photo, the hero. */
export const pageIds = ["home", "gallery", "projects", "about", "contacts"] as const;

/** The path parameters of a request about one page. */
export const pageParamsSchema = z.object({
  page: z.enum(pageIds),
});

/** A hero upload sends only the file: a text field is rejected. */
export const heroUploadBodySchema = z.object({}).strict();

export type PageId = (typeof pageIds)[number];
export type PageParams = z.infer<typeof pageParamsSchema>;

/** A page as the API returns it. */
export interface Page {
  /** `null` until a hero is uploaded. */
  hero: Image | null;
}
