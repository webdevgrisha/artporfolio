import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sitePagesQuery } from "@/entities/site-page";

import { savePageHeroes } from "./savePageHeroes";

/**
 * Saves the changed heroes, then loads the pages again. That happens after a failed save too: a
 * request that failed may still have changed a hero on the server.
 */
export function useSavePageHeroes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePageHeroes,
    // Awaited before the save resolves, so the form resets its fields to the loaded pages.
    onSettled: () => queryClient.invalidateQueries({ queryKey: sitePagesQuery.queryKey }),
  });
}
