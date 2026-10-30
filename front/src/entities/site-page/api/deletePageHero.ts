import { http } from "@/shared/api/http";

import type { SitePageId } from "../model/sitePage";

interface DeletePageHeroParams {
  /** The ETag of the hero the deletion was decided on. */
  etag: string;
  page: SitePageId;
}

/** Deletes the hero of the page and its files. Succeeds when the page has no hero. */
export async function deletePageHero({ etag, page }: DeletePageHeroParams): Promise<void> {
  await http.deleteIfMatch({
    path: `/pages/${page}/hero`,
    etag,
  });
}
