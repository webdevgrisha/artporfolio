import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, type Project, projectsQueryKey } from "@/entities/project";
import { getCreateProjectErrorMessage } from "../lib/saveErrorMessages";
import type { ProjectFormValues } from "./projectFormSchema";
import { toProjectBody } from "./toProjectBody";
import { saveProjectToastId } from "./useSaveProject";

interface CreateProjectParams {
  /** The id the form picked for the new project; every try of the form sends the same one. */
  id: string;
  values: ProjectFormValues;
}

/**
 * Creates a project from the form: uploads the picked files, then sends the project in one
 * request, which the server saves all or nothing. The new project is at the top of the list. A
 * retry never doubles it: the server refuses an id it already has with 412, and the form opens
 * what is saved.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getCreateProjectErrorMessage,
        successMessage: "Проект создан",
        toastId: saveProjectToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateProjectParams): Promise<Project> => {
      const body = await toProjectBody(values);

      return (await createProject({ body, id })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}
