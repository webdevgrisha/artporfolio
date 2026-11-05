import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";
import { type Image, imageSchema } from "@/shared/api/image";

import type { SitePageId } from "../model/sitePage";

interface ReplacePageHeroParams {
  /** The ETag of the hero the change was made from. */
  etag: string;
  page: SitePageId;
  /** The new file, uploaded with `uploadImage`. */
  uploadId: string;
}

/**
 * The hero of one page, shown behind its title, with its ETag; `null` until one is uploaded. An
 * upload puts the saved hero here.
 */
export function pageHeroQuery(page: SitePageId) {
  return queryOptions({
    queryFn: (): Promise<Tagged<Image | null>> =>
      http.getWithETag({ path: `/pages/${page}/hero`, schema: imageSchema.nullable() }),
    queryKey: ["site-pages", page, "hero"],
  });
}

/** Sets or replaces the hero of the page and returns it as stored by the server, with its new ETag. */
export function replacePageHero({
  etag,
  page,
  uploadId,
}: ReplacePageHeroParams): Promise<Tagged<Image>> {
  return http.putIfMatch({
    path: `/pages/${page}/hero`,
    body: { uploadId },
    etag,
    schema: imageSchema,
  });
}
