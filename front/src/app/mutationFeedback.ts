import type { QueryClient } from "@tanstack/react-query";

import { savedMessage, showErrorToast, showSuccessToast } from "@/shared/ui/toast";

/**
 * Shows the result of every change that declares `meta.feedback` in a toast, so a form only
 * resets its fields after a save and keeps them after a failure. A mutation reports its result
 * after its own callbacks, such as loading the changed data again. Returns the unsubscribe.
 */
export function showMutationFeedback(queryClient: QueryClient): () => void {
  return queryClient.getMutationCache().subscribe((event) => {
    if (event.type !== "updated") return;

    const feedback = event.mutation.meta?.feedback;
    if (!feedback) return;

    if (event.action.type === "success") {
      showSuccessToast(feedback.successMessage ?? savedMessage, { id: feedback.toastId });
    } else if (event.action.type === "error") {
      showErrorToast(feedback.getErrorMessage(event.action.error), { id: feedback.toastId });
    }
  });
}
