import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteProject, type Project, projectsQueryKey } from "@/entities/project";

import { getDeleteProjectErrorMessage } from "../lib/saveErrorMessages";

/**
 * Deletes a project with its photos, then loads the projects and their order again. The table
 * names the project by its title, so the deletion applies to whatever version is saved.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getDeleteProjectErrorMessage,
        successMessage: "Проект удалён",
        toastId: "project-delete",
      },
    },
    mutationFn: ({ id }: Project) => deleteProject({ etag: "*", id }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}
