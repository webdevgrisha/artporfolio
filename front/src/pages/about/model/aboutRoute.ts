import { aboutQuery } from "@/entities/about";
import { queryClient } from "@/shared/api/queryClient";

/**
 * Loads the data afresh on entering the page, even when it is cached: the form takes its saved
 * values from it once, so they must not be outdated.
 */
export async function aboutLoader() {
  await queryClient.fetchQuery({ ...aboutQuery, staleTime: 0 });

  return null;
}
