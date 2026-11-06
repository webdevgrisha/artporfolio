import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteProject, type ProjectSummary, projectsQueryKey } from "@/entities/project";

import { usePendingIds } from "@/shared/lib/usePendingIds";

import { getDeleteProjectErrorMessage } from "../lib/saveErrorMessages";

const deleteProjectMutationKey = [...projectsQueryKey, "delete"] as const;

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
    mutationFn: ({ id }: ProjectSummary) => deleteProject(id),
    mutationKey: deleteProjectMutationKey,
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

/** The ids of the projects being deleted, so that none is deleted twice meanwhile. */
export function useDeletingProjectIds(): readonly string[] {
  return usePendingIds(deleteProjectMutationKey);
}
