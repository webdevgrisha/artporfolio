import { queryOptions } from "@tanstack/react-query";

import type { SitePageId } from "../model/sitePage";
import { getPageHero } from "./getPageHero";

/** The hero of one page with its ETag. An upload puts the saved hero here. */
export function pageHeroQuery(page: SitePageId) {
  return queryOptions({
    queryFn: ({ signal }) => getPageHero({ page, signal }),
    queryKey: ["site-pages", page, "hero"],
  });
}
