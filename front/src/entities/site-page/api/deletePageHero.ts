import { http, type Tagged } from "@/shared/api/http";

import type { SitePageId } from "../model/sitePage";

interface DeletePageHeroParams {
  /** The ETag of the hero the deletion was decided on. */
  etag: string;
  page: SitePageId;
}

/**
 * Deletes the hero of the page and its files; succeeds when the page has no hero. Returns the
 * empty hero with its ETag, for the next change.
 */
export async function deletePageHero({ etag, page }: DeletePageHeroParams): Promise<Tagged<null>> {
  const emptyEtag = await http.deleteIfMatch({
    path: `/pages/${page}/hero`,
    etag,
  });

  return { data: null, etag: emptyEtag };
}
