import { http, type Tagged } from "@/shared/api/http";
import type { Image } from "@/shared/api/image";

import { pageHeroResponseSchema, type SitePageId } from "../model/sitePage";

interface GetPageHeroParams {
  page: SitePageId;
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

/**
 * The main photo of the page, shown behind its title; `null` until one is uploaded. Comes with the
 * ETag that a change of it sends back.
 */
export async function getPageHero({
  page,
  signal,
}: GetPageHeroParams): Promise<Tagged<Image | null>> {
  const { data, etag } = await http.getWithETag({
    path: `/pages/${page}/hero`,
    schema: pageHeroResponseSchema,
    signal,
  });

  return { data: data.hero, etag };
}
