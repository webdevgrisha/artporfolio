import { useMutation, useQueryClient } from "@tanstack/react-query";

import { processPhotosQuery } from "@/entities/about";
import type { MutationFeedback } from "@/shared/api/queryClient";

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
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveProcessPhotosFeedback },
    mutationFn: saveProcessPhotos,
    onSuccess: (list) => queryClient.setQueryData(processPhotosQuery.queryKey, list),
  });
}
