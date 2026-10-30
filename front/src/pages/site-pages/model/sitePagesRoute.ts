import { sitePagesQuery } from "@/entities/site-page";
import { queryClient } from "@/shared/api/queryClient";

/**
 * Loads the data afresh on entering the page, even when it is cached: the heroes may have been
 * changed in another tab.
 */
export async function sitePagesLoader() {
  await queryClient.fetchQuery({ ...sitePagesQuery, staleTime: 0 });

  return null;
}
