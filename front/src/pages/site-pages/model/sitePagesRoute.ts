import { pageHeroQuery, sitePageIds } from "@/entities/site-page";
import { queryClient } from "@/shared/api/queryClient";

/**
 * Loads every hero afresh on entering the page, even when it is cached: the heroes may have been
 * changed in another tab, and each change sends back the ETag of the hero it was made from.
 */
export async function sitePagesLoader() {
  await Promise.all(
    sitePageIds.map((page) => queryClient.fetchQuery({ ...pageHeroQuery(page), staleTime: 0 })),
  );

  return null;
}
