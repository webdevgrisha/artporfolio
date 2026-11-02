import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";

import { deleteProject, type Project, projectsQueryKey } from "@/entities/project";

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
    mutationFn: ({ id }: Project) => deleteProject({ etag: "*", id }),
    mutationKey: deleteProjectMutationKey,
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

/** Whether the project is being deleted, so that it is not deleted twice meanwhile. */
export function useIsDeletingProject(id: string): boolean {
  const deletions = useMutationState({
    filters: {
      mutationKey: deleteProjectMutationKey,
      predicate: (mutation) => (mutation.state.variables as Project | undefined)?.id === id,
      status: "pending",
    },
  });

  return deletions.length > 0;
}
