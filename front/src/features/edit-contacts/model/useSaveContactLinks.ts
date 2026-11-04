import { contactLinksQuery, replaceContactLinks } from "@/entities/contacts";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { useReplaceResource } from "@/shared/api/useReplaceResource";

import { getSaveContactLinksErrorMessage } from "../lib/saveErrorMessages";

export const saveContactLinksFeedback: MutationFeedback = {
  getErrorMessage: getSaveContactLinksErrorMessage,
  toastId: "contact-links-save",
};

/**
 * Replaces all links, then puts the saved links into the cache: the server returns them with
 * their ETag, so the page need not load them again.
 */
export function useSaveContactLinks() {
  return useReplaceResource({
    feedback: saveContactLinksFeedback,
    mutationFn: replaceContactLinks,
    queryKey: contactLinksQuery.queryKey,
  });
}
