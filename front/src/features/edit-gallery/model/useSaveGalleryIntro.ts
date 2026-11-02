import { useMutation, useQueryClient } from "@tanstack/react-query";

import { galleryIntroQuery, replaceGalleryIntro } from "@/entities/gallery";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { getSaveIntroErrorMessage } from "../lib/saveErrorMessages";

export const saveGalleryIntroFeedback: MutationFeedback = {
  getErrorMessage: getSaveIntroErrorMessage,
  toastId: "gallery-intro-save",
};

/**
 * Replaces the text, then puts the saved text into the cache: the server returns it with its
 * ETag, so the page need not load it again.
 */
export function useSaveGalleryIntro() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveGalleryIntroFeedback },
    mutationFn: replaceGalleryIntro,
    onSuccess: (saved) => queryClient.setQueryData(galleryIntroQuery.queryKey, saved),
  });
}
