import { galleryIntroQuery, replaceGalleryIntro } from "@/entities/gallery";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { useReplaceResource } from "@/shared/api/useReplaceResource";

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
  return useReplaceResource({
    feedback: saveGalleryIntroFeedback,
    mutationFn: replaceGalleryIntro,
    queryKey: galleryIntroQuery.queryKey,
  });
}
