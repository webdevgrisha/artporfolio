import { useMutation, useQueryClient } from "@tanstack/react-query";

import { aboutTextQuery, replaceAboutText } from "@/entities/about";
import type { MutationFeedback } from "@/shared/api/queryClient";

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
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveAboutTextFeedback },
    mutationFn: replaceAboutText,
    onSuccess: (saved) => queryClient.setQueryData(aboutTextQuery.queryKey, saved),
  });
}
