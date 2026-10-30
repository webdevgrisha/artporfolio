import { http, type Tagged } from "@/shared/api/http";
import type { Image } from "@/shared/api/image";

import { heroResponseSchema, type SitePageId } from "../model/sitePage";

interface ReplacePageHeroParams {
  /** The ETag of the hero the change was made from. */
  etag: string;
  page: SitePageId;
  /** The new file, uploaded with `uploadImage`. */
  uploadId: string;
}

/** Sets or replaces the hero of the page and returns it as stored by the server, with its new ETag. */
export async function replacePageHero({
  etag,
  page,
  uploadId,
}: ReplacePageHeroParams): Promise<Tagged<Image>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: `/pages/${page}/hero`,
    body: { uploadId },
    etag,
    schema: heroResponseSchema,
  });

  return { data: data.hero, etag: savedEtag };
}
