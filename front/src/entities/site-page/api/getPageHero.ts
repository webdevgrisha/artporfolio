import { http, type Tagged } from "@/shared/api/http";
import { type Image, imageSchema } from "@/shared/api/image";

import type { SitePageId } from "../model/sitePage";

/**
 * The main photo of the page, shown behind its title; `null` until one is uploaded. Comes with the
 * ETag that a change of it sends back.
 */
export function getPageHero(page: SitePageId): Promise<Tagged<Image | null>> {
  return http.getWithETag({
    path: `/pages/${page}/hero`,
    schema: imageSchema.nullable(),
  });
}
