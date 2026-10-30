import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteProject,
  type Project,
  projectsOrderQuery,
  projectsQuery,
  projectsQueryKey,
  replaceProjectsOrder,
} from "@/entities/project";

import { getDeleteProjectErrorMessage, getReorderErrorMessage } from "../lib/saveErrorMessages";

interface ReorderProjectsParams {
  /** The ETag of the order the table shows. */
  etag: string;
  /** Every project, once, in the new order. */
  ids: readonly string[];
}

function sortByIds(projects: readonly Project[], ids: readonly string[]): Project[] {
  const byId = new Map(projects.map((project) => [project.id, project]));

  return ids.flatMap((id) => byId.get(id) ?? []);
}

/**
 * Saves a new order at once. The table shows it before the server answers; a failed save loads
 * the projects and their order again: another tab may have changed them, and a request that
 * failed may still have saved the order.
 */
export function useReorderProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getReorderErrorMessage,
        successMessage: "Порядок проектов сохранён",
        toastId: "projects-order",
      },
    },
    mutationFn: replaceProjectsOrder,
    onMutate: async ({ ids }: ReorderProjectsParams) => {
      await queryClient.cancelQueries({ queryKey: projectsQuery.queryKey });
      queryClient.setQueryData(projectsQuery.queryKey, (projects) =>
        projects ? sortByIds(projects, ids) : projects,
      );
    },
    onError: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
    onSuccess: (order) => queryClient.setQueryData(projectsOrderQuery.queryKey, order),
  });
}

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
