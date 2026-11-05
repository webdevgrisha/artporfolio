import { galleryColorsQuery, replaceGalleryColors } from "@/entities/gallery";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { useReplaceResource } from "@/shared/api/useReplaceResource";

import { getSaveColorsErrorMessage } from "../../lib/saveErrorMessages";

export const saveColorsFeedback: MutationFeedback = {
  getErrorMessage: getSaveColorsErrorMessage,
  toastId: "gallery-colors-save",
};

/**
 * Replaces every color, then puts the saved list into the cache: the server returns it sorted,
 * with its ETag, so the page need not load it again.
 */
export function useSaveColors() {
  return useReplaceResource({
    feedback: saveColorsFeedback,
    mutationFn: replaceGalleryColors,
    queryKey: galleryColorsQuery.queryKey,
  });
}
