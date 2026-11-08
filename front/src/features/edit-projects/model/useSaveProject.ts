import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectQuery, projectsQueryKey, replaceProject } from "@/entities/project";
import { putSavedResource } from "@/shared/api/savedResource";
import { getSaveProjectErrorMessage } from "../lib/saveErrorMessages";
import type { ProjectFormValues } from "./projectFormSchema";
import { toProjectBody } from "./toProjectBody";

interface SaveProjectParams {
  /** The ETag of the project the values were made from. */
  etag: string;
  values: ProjectFormValues;
}

/** The toasts of a project form replace each other: a later save replaces an error. */
export const saveProjectToastId = "project-save";

/**
 * Replaces the project with the values of the form, then puts the saved project into the cache
 * and loads the list again. A failed save changed nothing on the server.
 */
export function useSaveProject(id: string) {
  const queryClient = useQueryClient();
  const { queryKey } = projectQuery(id);

  return useMutation({
    meta: {
      feedback: { getErrorMessage: getSaveProjectErrorMessage, toastId: saveProjectToastId },
    },
    mutationFn: async ({ etag, values }: SaveProjectParams) =>
      replaceProject({ body: await toProjectBody(values), etag, id }),
    onSuccess: async (saved) => {
      await putSavedResource(queryClient, queryKey, saved);
      // The list shows the title and the photos; the table loads it afresh when it opens.
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey, refetchType: "none" });
    },
  });
}
