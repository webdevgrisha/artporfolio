import { slideshowQuery } from "@/entities/contacts";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { useReplaceResource } from "@/shared/api/useReplaceResource";

import { getSaveSlideshowErrorMessage } from "../lib/saveErrorMessages";
import { saveSlideshow } from "./saveSlideshow";

export const saveSlideshowFeedback: MutationFeedback = {
  getErrorMessage: getSaveSlideshowErrorMessage,
  toastId: "contact-slideshow-save",
};

/**
 * Saves the slideshow, then puts the saved one into the cache: the server returns all of it, so
 * the page need not load it again. A failed save changed nothing on the server.
 */
export function useSaveSlideshow() {
  return useReplaceResource({
    feedback: saveSlideshowFeedback,
    mutationFn: saveSlideshow,
    queryKey: slideshowQuery.queryKey,
  });
}
