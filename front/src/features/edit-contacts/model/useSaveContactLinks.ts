import { useMutation, useQueryClient } from "@tanstack/react-query";

import { contactLinksQuery, replaceContactLinks } from "@/entities/contacts";
import type { MutationFeedback } from "@/shared/api/queryClient";

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
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveContactLinksFeedback },
    mutationFn: replaceContactLinks,
    onSuccess: (saved) => queryClient.setQueryData(contactLinksQuery.queryKey, saved),
  });
}
