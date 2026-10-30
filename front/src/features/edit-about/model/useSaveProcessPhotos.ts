import { useMutation, useQueryClient } from "@tanstack/react-query";

import { aboutQuery, type ProcessPhoto } from "@/entities/about";

import type { ProcessPhotosChanges } from "./processPhotosChanges";
import { type SaveProcessPhotosResult, saveProcessPhotos } from "./saveProcessPhotos";

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
    mutationFn: async ({
      changes,
      savedProcessPhotos,
    }: SaveProcessPhotosVariables): Promise<SaveProcessPhotosResult> => {
      const result = await saveProcessPhotos(changes, savedProcessPhotos);

      // The result follows the requests that succeeded, but a request whose response was lost may
      // have changed the server too: the photos the server now has are the saved ones.
      try {
        const about = await queryClient.fetchQuery({ ...aboutQuery, staleTime: 0 });
        return { ...result, photos: about.processPhotos };
      } catch {
        return result;
      }
    },
    onError: () => queryClient.invalidateQueries({ queryKey: aboutQuery.queryKey }),
  });
}
