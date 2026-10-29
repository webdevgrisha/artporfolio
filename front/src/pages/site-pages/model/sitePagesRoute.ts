import { sitePagesQuery } from "@/entities/site-page";
import { queryClient } from "@/shared/api/queryClient";

/**
 * Loads the data afresh on entering the page, even when it is cached: the form takes its saved
 * values from it once, so they must not be outdated.
 */
export async function sitePagesLoader() {
  await queryClient.fetchQuery({ ...sitePagesQuery, staleTime: 0 });

  return null;
}
