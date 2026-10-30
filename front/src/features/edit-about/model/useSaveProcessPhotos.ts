import { useMutation, useQueryClient } from "@tanstack/react-query";

import { aboutQuery, type ProcessPhoto } from "@/entities/about";
import { getCsrfToken } from "@/shared/api/csrf";

import type { ProcessPhotosChanges } from "./processPhotosChanges";
import { saveProcessPhotos } from "./saveProcessPhotos";

interface SaveProcessPhotosVariables {
  changes: ProcessPhotosChanges;
  /** The process photos the changes were made against. */
  savedProcessPhotos: readonly ProcessPhoto[];
}

/**
 * Saves the changes of the process photos, then loads the About page again. That happens after a
 * failed save too: a request that failed may still have changed the photos on the server.
 */
export function useSaveProcessPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ changes, savedProcessPhotos }: SaveProcessPhotosVariables) =>
      saveProcessPhotos(changes, savedProcessPhotos, await getCsrfToken()),
    // Awaited before the save resolves, so the form resets its rows to the loaded page.
    onSettled: () => queryClient.invalidateQueries({ queryKey: aboutQuery.queryKey }),
  });
}
