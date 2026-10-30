import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectsOrderQuery, projectsQuery, replaceProjectsOrder } from "@/entities/project";
import type { MutationFeedback } from "@/shared/api/queryClient";

import { getSaveOrderErrorMessage } from "../lib/saveErrorMessages";

export const saveProjectsOrderFeedback: MutationFeedback = {
  getErrorMessage: getSaveOrderErrorMessage,
  successMessage: "Порядок проектов сохранён",
  toastId: "projects-order-save",
};

/**
 * Puts the projects in a new order, then puts the saved order into the cache. The list of
 * projects is in the old order, so the next page that shows it loads it again.
 */
export function useSaveProjectsOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: saveProjectsOrderFeedback },
    mutationFn: replaceProjectsOrder,
    onSuccess: async (order) => {
      queryClient.setQueryData(projectsOrderQuery.queryKey, order);
      await queryClient.invalidateQueries({ queryKey: projectsQuery.queryKey });
    },
  });
}
