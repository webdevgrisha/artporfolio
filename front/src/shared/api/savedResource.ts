import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Puts the version of a resource the server returned on a save into its query. A read of it begun
 * before the save is cancelled first: ending later, it would bring back the old version and its
 * ETag. A page waiting for that read is never the one saving, as its form shows only once it ends.
 */
export async function putSavedResource<TSaved>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  saved: TSaved,
): Promise<void> {
  await queryClient.cancelQueries({ exact: true, queryKey });
  queryClient.setQueryData<TSaved>(queryKey, saved);
}
