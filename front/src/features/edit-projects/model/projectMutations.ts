import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createProject,
  type Project,
  type ProjectBody,
  projectQuery,
  projectsQueryKey,
  replaceProject,
} from "@/entities/project";
import { HttpError } from "@/shared/api/httpError";
import { toPhotoListItems } from "@/shared/lib/photoListForm";

import { getSaveProjectErrorMessage } from "../lib/saveErrorMessages";
import type { ProjectFormValues } from "./projectFormSchema";

interface CreateProjectParams {
  /** The id the form picked for the new project; every try of the form sends the same one. */
  id: string;
  values: ProjectFormValues;
}

interface SaveProjectParams {
  /** The ETag of the project the values were made from. */
  etag: string;
  values: ProjectFormValues;
}

/** Uploads the picked files, then gives the project as the server takes it. */
async function toProjectBody({
  description,
  link,
  photos,
  title,
}: ProjectFormValues): Promise<ProjectBody> {
  return { description, link, photos: await toPhotoListItems(photos), title };
}

/** The toasts of a project form replace each other: a later save replaces an error. */
export const saveProjectToastId = "project-save";

/**
 * Creates a project from the form: uploads the picked files, then sends the project in one
 * request, which the server saves all or nothing. The new project is at the top of the list.
 *
 * A try may create the project even though its response is lost. The next try then finds the
 * project there (412) and saves the values into it, so the project is neither lost nor doubled.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getSaveProjectErrorMessage,
        successMessage: "Проект создан",
        toastId: saveProjectToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateProjectParams): Promise<Project> => {
      const body = await toProjectBody(values);

      try {
        return (await createProject({ body, id })).data;
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 412)) throw error;
      }

      const { etag } = await queryClient.fetchQuery({ ...projectQuery(id), staleTime: 0 });

      return (await replaceProject({ body, etag, id })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

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
      queryClient.setQueryData(queryKey, saved);
      // The list shows the title and the photos; the table loads it afresh when it opens.
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey, refetchType: "none" });
    },
  });
}
