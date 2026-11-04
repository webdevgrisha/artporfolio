import { projectsIntroQuery, replaceProjectsIntro } from "@/entities/project";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { useReplaceResource } from "@/shared/api/useReplaceResource";

import { getSaveIntroErrorMessage } from "../lib/saveErrorMessages";

export const saveProjectsIntroFeedback: MutationFeedback = {
  getErrorMessage: getSaveIntroErrorMessage,
  toastId: "projects-intro-save",
};

/**
 * Replaces the text, then puts the saved text into the cache: the server returns it with its
 * ETag, so the page need not load it again.
 */
export function useSaveProjectsIntro() {
  return useReplaceResource({
    feedback: saveProjectsIntroFeedback,
    mutationFn: replaceProjectsIntro,
    queryKey: projectsIntroQuery.queryKey,
  });
}
