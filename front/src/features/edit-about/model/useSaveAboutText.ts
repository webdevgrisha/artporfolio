import { aboutTextQuery, replaceAboutText } from "@/entities/about";
import { translationResources, translationsQuery } from "@/entities/translation";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { useReplaceResource } from "@/shared/api/useReplaceResource";

import { getSaveTextErrorMessage } from "../lib/saveErrorMessages";

export const saveAboutTextFeedback: MutationFeedback = {
  getErrorMessage: getSaveTextErrorMessage,
  toastId: "about-text-save",
};

/**
 * Replaces all texts, then puts the saved texts into the cache: the server returns them with
 * their ETag, so the page need not load them again.
 */
export function useSaveAboutText() {
  return useReplaceResource({
    feedback: saveAboutTextFeedback,
    mutationFn: replaceAboutText,
    outdates: [translationsQuery(translationResources.aboutText).queryKey],
    queryKey: aboutTextQuery.queryKey,
  });
}
