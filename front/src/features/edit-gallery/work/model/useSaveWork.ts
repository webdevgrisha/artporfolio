import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  galleryCollectionsQueryKey,
  galleryWorkQuery,
  galleryWorksQueryKey,
  replaceGalleryWork,
} from "@/entities/gallery";
import { getSaveWorkErrorMessage } from "../lib/saveErrorMessages";
import { toWorkBody } from "./toWorkBody";
import type { WorkFormValues } from "./workFormSchema";

interface SaveWorkParams {
  /** The ETag of the work the values were made from. */
  etag: string;
  values: WorkFormValues;
}

/** The toasts of a work form replace each other: a later save replaces an error. */
export const saveWorkToastId = "gallery-work-save";

/**
 * Replaces the work with the values of the form, then puts the saved work into the cache and marks
 * the lists outdated. A failed save changed nothing on the server.
 */
export function useSaveWork(id: string) {
  const queryClient = useQueryClient();
  const { queryKey } = galleryWorkQuery(id);

  return useMutation({
    meta: {
      feedback: { getErrorMessage: getSaveWorkErrorMessage, toastId: saveWorkToastId },
    },
    mutationFn: async ({ etag, values }: SaveWorkParams) =>
      replaceGalleryWork({ body: await toWorkBody(values), etag, id }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(queryKey, saved);
      // The lists load afresh when they open; moving the work changes the works of its collections.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: galleryWorksQueryKey, refetchType: "none" }),
        queryClient.invalidateQueries({
          queryKey: galleryCollectionsQueryKey,
          refetchType: "none",
        }),
      ]);
    },
  });
}
