import { pageHeroQuery, sitePageIds } from "@/entities/site-page";
import { fetchFresh, loadPageData } from "@/shared/api/pageData";

/**
 * Loads every hero afresh on entering the page, even when it is cached: the heroes may have been
 * changed in another tab, and each change sends back the ETag of the hero it was made from.
 */
export function sitePagesLoader() {
  return loadPageData(...sitePageIds.map((page) => fetchFresh(pageHeroQuery(page))));
}
