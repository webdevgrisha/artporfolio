import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGalleryWork,
  type GalleryWork,
  galleryCollectionsQueryKey,
  galleryWorksQueryKey,
} from "@/entities/gallery";
import { getCreateWorkErrorMessage } from "../lib/saveErrorMessages";
import { toWorkBody } from "./toWorkBody";
import { saveWorkToastId } from "./useSaveWork";
import type { WorkFormValues } from "./workFormSchema";

interface CreateWorkParams {
  /** The id the form picked for the new work; every try of the form sends the same one. */
  id: string;
  values: WorkFormValues;
}

/**
 * Creates a work from the form: uploads its photos, then sends the work in one request, which the
 * server saves all or nothing. A retry never doubles it: the server refuses an id it already has
 * with 412, and the form opens what is saved.
 */
export function useCreateWork() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: getCreateWorkErrorMessage,
        successMessage: "Работа создана",
        toastId: saveWorkToastId,
      },
    },
    mutationFn: async ({ id, values }: CreateWorkParams): Promise<GalleryWork> => {
      const body = await toWorkBody(values);

      return (await createGalleryWork({ body, id })).data;
    },
    // A work in a collection changes the works of that collection too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey }),
        queryClient.invalidateQueries({ queryKey: galleryCollectionsQueryKey }),
      ]),
  });
}
