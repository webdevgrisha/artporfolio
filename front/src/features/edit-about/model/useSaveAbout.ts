import { useMutation, useQueryClient } from "@tanstack/react-query";

import { aboutQuery, type ProcessPhoto } from "@/entities/about";

import type { AboutChanges } from "./aboutChanges";
import { saveAbout } from "./saveAbout";

interface SaveAboutVariables {
  changes: AboutChanges;
  /** The process photos the changes were made against. */
  savedProcessPhotos: readonly ProcessPhoto[];
}

/**
 * Saves the changed parts of the About page, then loads it again. That happens after a failed save
 * too: a request that failed may still have changed the page on the server.
 */
export function useSaveAbout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ changes, savedProcessPhotos }: SaveAboutVariables) =>
      saveAbout(changes, savedProcessPhotos),
    // Awaited before the save resolves, so the form resets its fields to the loaded page.
    onSettled: () => queryClient.invalidateQueries({ queryKey: aboutQuery.queryKey }),
  });
}
