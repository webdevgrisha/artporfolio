import { processPhotosQuery } from "@/entities/about";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { useReplaceResource } from "@/shared/api/useReplaceResource";

import { getSaveProcessPhotosErrorMessage } from "../lib/saveErrorMessages";
import { saveProcessPhotos } from "./saveProcessPhotos";

export const saveProcessPhotosFeedback: MutationFeedback = {
  getErrorMessage: getSaveProcessPhotosErrorMessage,
  toastId: "process-photos-save",
};

/**
 * Saves the list of process photos, then puts the saved list into the cache: the server returns
 * all of it, so the page need not load it again. A failed save changed nothing on the server.
 */
export function useSaveProcessPhotos() {
  return useReplaceResource({
    feedback: saveProcessPhotosFeedback,
    mutationFn: saveProcessPhotos,
    queryKey: processPhotosQuery.queryKey,
  });
}
