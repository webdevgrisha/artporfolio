import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";

import type { MutationFeedback } from "./queryClient";
import { putSavedResource } from "./savedResource";

interface UseReplaceResourceParams<TSaved, TVariables> {
  feedback: MutationFeedback;
  /** Sends the whole resource; resolves with it as saved, with its new ETag. */
  mutationFn: (variables: TVariables) => Promise<TSaved>;
  /** The query of the resource, which gets the saved version. */
  queryKey: QueryKey;
}

/**
 * Saves a resource as a whole, then puts the version the server returns into its query, so the
 * page need not load it again.
 */
export function useReplaceResource<TSaved, TVariables>({
  feedback,
  mutationFn,
  queryKey,
}: UseReplaceResourceParams<TSaved, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback },
    mutationFn,
    onSuccess: (saved) => putSavedResource(queryClient, queryKey, saved),
  });
}
