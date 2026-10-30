import { http } from "@/shared/api/http";

import type { SitePageId } from "../model/sitePage";

interface DeletePageHeroParams {
  page: SitePageId;
}

/** Deletes the hero of the page and its files. Succeeds when the page has no hero. */
export async function deletePageHero({ page }: DeletePageHeroParams): Promise<void> {
  await http.delete({
    path: `/pages/${page}/hero`,
  });
}
