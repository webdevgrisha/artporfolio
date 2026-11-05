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
