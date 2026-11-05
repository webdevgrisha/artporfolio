import { http, type Tagged } from "@/shared/api/http";
import { type Image, imageSchema } from "@/shared/api/image";

import type { SitePageId } from "../model/sitePage";

interface GetPageHeroParams {
  page: SitePageId;
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

/**
 * The main photo of the page, shown behind its title; `null` until one is uploaded. Comes with the
 * ETag that a change of it sends back.
 */
export function getPageHero({ page, signal }: GetPageHeroParams): Promise<Tagged<Image | null>> {
  return http.getWithETag({
    path: `/pages/${page}/hero`,
    schema: imageSchema.nullable(),
    signal,
  });
}
